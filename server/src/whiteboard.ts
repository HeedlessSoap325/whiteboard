import { WebSocketServer, WebSocket } from "ws";
import {configDotenv} from "dotenv";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as fs from "fs";
import * as path from "path";
import * as yws from "y-websocket";
configDotenv({path: process.argv[2] || ".env"});

interface RoomState {
	clients: Set<WebSocket>,
	doc: Y.Doc,
	awareness: awarenessProtocol.Awareness,
}

const PERSIST_DIR = process.env.PERSIST_DIR || "./room-states";

const wss = new WebSocketServer({ port: Number(process.env.PUBLIC_SERVER_PORT) || 1999 });
const rooms = new Map<string, RoomState>();

fs.mkdirSync(PERSIST_DIR, { recursive: true });

function roomFilePath(roomId: string) {
	// Sanitise roomId so it's safe as a filename
	const safe = roomId.replace(/[^a-zA-Z0-9_-]/g, "_");
	return path.join(PERSIST_DIR, `${safe}.bin`);
}

function loadDoc(roomId: string): Y.Doc {
	const doc = new Y.Doc();
	const filePath = roomFilePath(roomId);
	if (fs.existsSync(filePath)) {
		const state = fs.readFileSync(filePath);
		Y.applyUpdate(doc, state);
		console.log(`[${roomId}] Loaded persisted state (${state.length} bytes)`);
	}
	return doc;
}
  
function saveDoc(roomId: string, doc: Y.Doc) {
	const state = Y.encodeStateAsUpdate(doc);
	fs.writeFileSync(roomFilePath(roomId), state);
	console.log(`[${roomId}] Persisted state (${state.length} bytes)`);
}

wss.on("connection", (socket: WebSocket, req) => {
	const roomId = new URL(req.url!, `http://${process.env.PUBLIC_SERVER_BASE || "localhost"}`).searchParams.get("room") ?? "default";

	if (!rooms.has(roomId)) {
		const doc = loadDoc(roomId);
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
			saveDoc(roomId, room.doc);
			room.doc.destroy();
			rooms.delete(roomId);
			console.log(`[${roomId}] Room closed and evicted`);
		}
	});
});

console.log(`WS server running on ws://${process.env.PUBLIC_SERVER_BASE || "localhost"}:${process.env.PUBLIC_SERVER_PORT || 1999}`);