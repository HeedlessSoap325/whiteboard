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