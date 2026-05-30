export interface StrokePoint {
	x: number , 
	y: number, 
	pressure: number
}

export interface Stroke {
	id: string,
	color: string,
	width: number,
	points: StrokePoint[]
}

export enum StrokeToolType {
	PEN,
	ERASER,
}

export interface StrokeTool {
	color: string,
	width: number,
	type: StrokeToolType,
	positionIndex: number,
}

export enum Mode {
	DRAWING,
	MOUSE
}

export interface Note {
	id: string,
	x: number,
	y: number,
	content: string,
}

export interface Room {
	name: string,
	owner: string,
	public: boolean,
	allowedParticipants: String[],
	numActiveUsers?: number,
}

export interface PanState {
	x: number,
	y: number,
}

export interface ViewportContext {
	pan: () => PanState,
	zoom: () => number,
	screenToWorld: (screenX: number, screenY: number) => PanState,
	worldToScreen: (worldX: number, worldY: number) => PanState,
	transform: () => string
}