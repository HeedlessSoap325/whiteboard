import { matchedData} from "express-validator";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import bcrypt from "bcryptjs";

const DB_FILE = process.env.DB_FILE || "./db.json";
const db = new Low<any>(new JSONFile(DB_FILE), { users: [] });
await db.read();

export const registerSchema = {
	username: {
		isString: true,
		notEmpty: true,
		errorMessage: "Invalid Username"
	},
	password: {
		isLength: { 
			options: { min: 8 },
			errorMessage: "Password has to be at least 8 characters long"
		},
		isString: true,
		notEmpty: true,
		errorMessage: "Invalid Password"
	}
}

export const loginSchema = {
	username: {
		isString: true,
		notEmpty: true,
		errorMessage: "Invalid Username"
	},
	password: {
		isString: true,
		notEmpty: true,
		errorMessage: "Invalid Password"
	}
}

export async function register(req: any, res: any) {
	const data = matchedData(req);

	const user = db.data.users.find((u: any) => u.username === data.username);
	if (user) return res.status(400).send(`User '${data.username}' already exists!`);

	const hash = await bcrypt.hash(data.password, 10)
	db.data.users.push({ username: data.username, password: hash })
	await db.write();

	req.session.user = {
		uername: data.username,
	};

	res.status(200).send(`Now logged in as ${data.username}`);
}

export async function login(req: any, res: any) {
	const data = matchedData(req);

	const user = db.data.users.find((u: any) => u.username === data.username);
	if (!user) return res.status(400).send(`No such User '${data.username}'`);
	
	const result = await bcrypt.compare(data.password, user.password);

	if (result) {
		req.session.user = {
			uername: data.username,
		};

		res.status(200).send(`Now logged in as ${data.username}`);
	}else {
		res.status(400).send("Username and password don't match!");
	}
}

export function logout(req: any, res: any) {
	if (req.session.user) {
		req.session.user = null;
		res.status(200).send("logout");
	} else {
		res.status(400).send("You are not logged in yet. Please log in at /auth/login or register at /auth/register!");
	}
}