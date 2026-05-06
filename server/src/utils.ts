import * as path from "path";
import * as Y from "yjs";
import * as fs from "fs";

function roomFilePath(roomId: string, PERSIST_DIR: string) {
	// Sanitise roomId so it's safe as a filename
	const safe = roomId.replace(/[^a-zA-Z0-9_-]/g, "_");
	return path.join(PERSIST_DIR, `${safe}.bin`);
}

export function loadDoc(roomId: string, PERSIST_DIR: string): Y.Doc {
	const doc = new Y.Doc();
	const filePath = roomFilePath(roomId, PERSIST_DIR);
	if (fs.existsSync(filePath)) {
		const state = fs.readFileSync(filePath);
		Y.applyUpdate(doc, state);
		console.log(`[${roomId}] Loaded persisted state (${state.length} bytes)`);
	}
	return doc;
}
  
export function saveDoc(roomId: string, doc: Y.Doc, PERSIST_DIR: string) {
	const state = Y.encodeStateAsUpdate(doc);
	fs.writeFileSync(roomFilePath(roomId, PERSIST_DIR), state);
	console.log(`[${roomId}] Persisted state (${state.length} bytes)`);
}