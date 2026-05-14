import { goto } from '$app/navigation';
import { env } from '$env/dynamic/public';

export interface User {
	name: string,
}

export async function getSession(): Promise<null | User> {
	const response = await fetch(`http://${env.PUBLIC_SERVER_BASE}:${env.PUBLIC_SERVER_PORT}/auth/verify`, {
		method: "GET",
		credentials: "include",
	});

	const data = await response.json();

	if (!response.ok) {
		return null;
	} else {
		return { name: data["msg"] };
	}
}

export async function verifySession(): Promise<boolean> {
	return (await getSession()) !== null;
}