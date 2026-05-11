import { matchedData} from "express-validator";
import { db } from "../db.ts";

interface Room {
	name: string,
	owner: string,
	allowedParticipants: String[],
}

const MAX_ROOM_PARTICIPANTS = Number(process.env.MAX_ROOM_CAPACITY) || 100;

export const roomSchema = {
	name: {
		isString: true,
		notEmpty: true,
		errorMessage: "Invalid room name"
	},
	allowedParticipants: {
		isArray: { 
			options: {
				max: MAX_ROOM_PARTICIPANTS,
				errorMessage: `The limit of participants per room is ${MAX_ROOM_PARTICIPANTS} (including you)`
			}
		},
		notEmpty: false,
		errorMessage: "Invalid Participants List",
	}
}

export async function createRoom(req: any, res: any) {
	if (!db) return req.sendStatus(500);
	const data = matchedData(req);

	const existingRoom: Room | null = db.data.rooms.find((r: Room) => r.name === data.name);
	if (existingRoom) return res.status(404).send(`Room '${data.name}' already exists!`);

	const allowedParticipants: String[] = data.allowedParticipants;
	allowedParticipants.push(req.session.user.name);

	const room: Room = {
		owner: req.session.user.name,
		name: data.name,
		allowedParticipants,
	}

	db.data.rooms.push(room);
	await db.write();
	res.status(200).send(`Room '${data.name}' was created successfully.`);
}

export function getRooms(req: any, res: any) {
	if (!db) return req.sendStatus(500);
	const rooms = db.data.rooms.filter((r: Room) => r.allowedParticipants.includes(req.session.user.name));
	return res.status(200).json(rooms || []);
}

export async function deleteRoom(req: any, res: any) {
	if (!db) return req.sendStatus(500);
	const roomName = req.params.name;

	const room: Room = db.data.rooms.find((r: Room) => r.name === roomName);
	if (!room) res.status(404).send(`Room '${roomName}' doesn't exist!`);

	if(room.owner !== req.session.user.name) {
		res.status(403).send("You are not the owner of this room!");
	} else {
		db.data.rooms = db.data.rooms.filter((r: Room) => r.name !== roomName);
		await db.write();

		res.status(200).send(`Deleted Room '${roomName}' successfully.`);
	}
}