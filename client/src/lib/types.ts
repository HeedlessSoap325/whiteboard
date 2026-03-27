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