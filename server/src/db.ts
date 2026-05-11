import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

export let db: Low<any> | null = null;

export async function setupDB() {
	const DB_FILE = process.env.DB_FILE || "./db.json";
	db = new Low<any>(new JSONFile(DB_FILE), { users: [], rooms: [] });
	await db.read();
}