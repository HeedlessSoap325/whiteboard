import { matchedData} from "express-validator";
import bcrypt from "bcryptjs";
import { db } from "../db.ts";
import { errorify } from "../whiteboard.ts";

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
	if (!db) return req.sendStatus(500);
	const data = matchedData(req);

	const user = db.data.users.find((u: any) => u.username === data.username);
	if (user) return res.status(400).json(errorify(`User '${data.username}' already exists!`));

	const hash = await bcrypt.hash(data.password, 10)
	db.data.users.push({ username: data.username, password: hash })
	await db.write();

	req.session.user = {
		name: data.username,
	};

	return res.status(200).json( {msg: `Now logged in as ${data.username}`} );
}

export async function login(req: any, res: any) {
	if (!db) return req.sendStatus(500);
	const data = matchedData(req);

	const user = db.data.users.find((u: any) => u.username === data.username);
	if (!user) return res.status(400).json(errorify(`No such User '${data.username}'`));
	
	const result = await bcrypt.compare(data.password, user.password);

	if (result) {
		req.session.user = {
			name: data.username,
		};

		return res.status(200).json( {msg: `Now logged in as ${data.username}`} );
	}else {
		return res.status(400).json(errorify("Username and password don't match!"));
	}
}

export function verify(req: any, res: any) {
	return res.status(200).json( {msg: req.session.user.name} )
}

export function logout(req: any, res: any) {
	req.session.user = null;
	return res.status(200).json( {msg: "logout"} );
}