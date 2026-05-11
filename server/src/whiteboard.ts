import { WebSocketServer, WebSocket } from "ws";
import {configDotenv} from "dotenv";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as fs from "fs";
import * as yws from "y-websocket";
import express from "express";
import rateLimit from "express-rate-limit";
import cookieSession from "cookie-session";
import { checkSchema, validationResult } from "express-validator";
import { loadDoc, saveDoc } from "./utils.ts";
import { login, loginSchema, logout, register, registerSchema } from "./controllers/auth.ts";
import { createRoom, deleteRoom, getRooms, type Room, roomSchema } from "./controllers/room.ts";
import { db, setupDB } from "./db.ts";
import { promisify } from "util";
import cors from "cors";

configDotenv({path: process.argv[2] || ".env"});

interface RoomState {
	clients: Set<WebSocket>,
	doc: Y.Doc,
	awareness: awarenessProtocol.Awareness,
}

const PERSIST_DIR = process.env.PERSIST_DIR || "./room-states";
const SERVER_PORT = Number(process.env.PUBLIC_SERVER_PORT) || 1999;

fs.mkdirSync(PERSIST_DIR, { recursive: true });
setupDB();

const app = express();
const server = app.listen(SERVER_PORT, () => console.log(`Server listening on port ${SERVER_PORT}`))
const wss = new WebSocketServer({ noServer: true });
const rooms = new Map<string, RoomState>();

const ratelimitMinutes = 10;
const limiter = rateLimit({
	windowMs: ratelimitMinutes * 60 * 1000,
	max: 25,
	message: `Too many requests from this IP, please try again after ${ratelimitMinutes} minutes`,
});
app.use(limiter);

const cookies = cookieSession({
	name: "whiteboard-session",
	sameSite: "lax",
	secret: process.env.COOKIE_SECRET || "poadieugfeiusqgjd9e8d'w8d6'9we6eurt287trt82t82te08q7gjjjge8tf2e961",
	maxAge: 24 * 60 * 60 * 1000 // 24 hours
});
app.use(cookies);

app.use(cors({
	origin: `http://${process.env.PUBLIC_SERVER_BASE}:5173`,
	credentials: true,
}));

const validateSchema = (req: any, res: any, next: any) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	} else {
		next();
	}
};

const validateLogin = (req: any, res: any, next: any) => {
	if (!req.session.user || !req.session.user.name) {
		return res.status(401).send("You are not logged in yet. Please log in at /auth/login or register at /auth/register!");
	} else {
		next();
	}
}

app.use(express.json())

app.post("/auth/register", checkSchema(registerSchema), validateSchema, register);
app.post("/auth/login", checkSchema(loginSchema), validateSchema, login);
app.delete("/auth/logout", validateLogin, logout);

app.post("/room/", checkSchema(roomSchema), validateSchema, validateLogin, createRoom);
app.get("/room/", validateLogin, getRooms);
app.delete("/room/:name", validateLogin, deleteRoom);

function checkRoomAccess(username: string, roomId: string): boolean {
	if (!db) return false;

	const room = db.data.rooms.find((r: Room) => r.name === roomId);
	if (!room) return false;
	
	return room.allowedParticipants.includes(username);
}
  
const runCookies = promisify(
	(req: any, res: any, next: (err?: any) => void) => cookies(req, res, next)
);


server.on("upgrade", async (req: any, socket, head) => {
	try {
		// Run cookie-session so req.session is populated
		await runCookies(req, {} as any);

		if (!req.session?.user) {
			socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
			socket.destroy();
			return;
		}

		const roomId = new URL(req.url!, `http://${process.env.PUBLIC_SERVER_BASE || "localhost"}`).searchParams.get("room") ?? "default";

		const hasAccess = checkRoomAccess(req.session.user.name, roomId);
		if (!hasAccess) {
			socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
			socket.destroy();
			return;
		}

		wss.handleUpgrade(req, socket, head, (ws) => {
			wss.emit("connection", ws, req);
		});
	} catch (err) {
		console.error("WebSocket upgrade error:", err);
		socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
		socket.destroy();
	}
});

wss.on("connection", (socket: WebSocket, req) => {
	const roomId = new URL(req.url!, `http://${process.env.PUBLIC_SERVER_BASE || "localhost"}`).searchParams.get("room") ?? "default";

	if (!rooms.has(roomId)) {
		const doc = loadDoc(roomId, PERSIST_DIR);
		const awareness = new awarenessProtocol.Awareness(doc);
		rooms.set(roomId, { clients: new Set(), doc, awareness });
	}
	
	const room = rooms.get(roomId)!;
	room.clients.add(socket);
	console.log(`[${roomId}] Client connected (${room.clients.size} total)`);

	const enc = encoding.createEncoder();
	encoding.writeVarUint(enc, yws.messageSync);
	syncProtocol.writeSyncStep1(enc, room.doc);
	socket.send(encoding.toUint8Array(enc));
	
	const states = Array.from(room.awareness.getStates().keys()).filter((id) => id !== room.doc.clientID);
	if (states.length > 0) {
		const enc = encoding.createEncoder();
		encoding.writeVarUint(enc, yws.messageAwareness);
		encoding.writeVarUint8Array(enc, awarenessProtocol.encodeAwarenessUpdate(room.awareness, states));
		socket.send(encoding.toUint8Array(enc));
	}

	socket.on("message", (rawData: Buffer) => {
		const data = new Uint8Array(rawData);
		const dec = decoding.createDecoder(data);

		// VERY HACKY!!!
		const messageType = decoding.readVarUint(dec);
	
		switch (messageType) {
		  	case yws.messageSync: {
				// See messageHandlers[messageSync] in y-websocket.js 
				const enc = encoding.createEncoder();
				encoding.writeVarUint(enc, yws.messageSync);
		
				const syncType = syncProtocol.readSyncMessage(dec, enc, room.doc, socket);
		
				if (encoding.length(enc) > 1) {
					socket.send(encoding.toUint8Array(enc));
				}
		
				if (syncType !== syncProtocol.messageYjsSyncStep2 && syncType !== syncProtocol.messageYjsUpdate) {
					return;
				}
				break;
		  	}
	
			case yws.messageAwareness: {
				// See messageHandlers[messageAwareness] in y-websocket.js 
				awarenessProtocol.applyAwarenessUpdate(room.awareness, decoding.readVarUint8Array(dec), socket);
				break;
			}
		}

		room.clients.forEach((client) => {
			if (client !== socket && client.readyState === WebSocket.OPEN) {
				client.send(data);
			}
		});
	});

	socket.on("close", () => {
		awarenessProtocol.removeAwarenessStates(room.awareness, [room.doc.clientID], "disconnect");
		room.clients.delete(socket);
		console.log(`[${roomId}] Client disconnected (${room.clients.size} remaining)`);
	  
		if (room.clients.size === 0) {
			saveDoc(roomId, room.doc, PERSIST_DIR);
			room.doc.destroy();
			rooms.delete(roomId);
			console.log(`[${roomId}] Room closed and evicted`);
		}
	});
});