import { WebSocketServer, WebSocket } from "ws";
import {configDotenv} from "dotenv";
configDotenv({path: process.argv[2] || ".env"});

const wss = new WebSocketServer({ port: Number(process.env.PUBLIC_SERVER_PORT) || 1999 });
const rooms = new Map<string, Set<WebSocket>>();

wss.on("connection", (socket: WebSocket, req) => {
	console.log(`New Connection with url: ${socket.url}`)
	const roomId = new URL(req.url!, `http://${process.env.PUBLIC_SERVER_BASE || "localhost"}`).searchParams.get("room") ?? "default";

	if (!rooms.has(roomId)) rooms.set(roomId, new Set());
	const room = rooms.get(roomId)!;
	room.add(socket);

	socket.on("message", (data) => {
		// Relay raw Yjs binary update to everyone else in the room
		room.forEach((client) => {
		if (client !== socket && client.readyState === WebSocket.OPEN) {
			client.send(data);
		}
		});
	});

	socket.on("close", () => {
		console.log("Closed Connection")
		room.delete(socket);
		if (room.size === 0) rooms.delete(roomId);
	});
});

console.log(`WS server running on ws://${process.env.PUBLIC_SERVER_BASE || "localhost"}:${process.env.PUBLIC_SERVER_PORT || 1999}`);