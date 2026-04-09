<script lang="ts">
	import { Mode, StrokeToolType, type Stroke, type StrokePoint, type StrokeTool } from "$lib/types";
    import { getStrokes } from "$lib/sync/provider";
	import { onMount } from "svelte";
    import { strokesStore } from "$lib/stores/whiteboard";
    import Toolbar from "$lib/components/Canvas/Toolbar.svelte";
    import { modeStore } from "$lib/stores/tool";
	import {v4 as uuidv4} from "uuid";

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;

	let currentTool: StrokeTool = $state<StrokeTool>({
		color: '#000',
		width: 2,
		type: StrokeToolType.PEN,
		positionIndex: -1,
	})

	let isDrawing = false;
	let currentStroke: Stroke | null = null;

	let isErasing = false;
	let erasingPoint1: StrokePoint | null = null;
	let erasingPoint2: StrokePoint | null = null;

	onMount(() => {
		canvas.width = window.innerWidth;
    	canvas.height = window.innerHeight;

		ctx = canvas.getContext("2d");

		getStrokes().observe(redrawCanvas);
	});

	$effect(() => {
		if ($modeStore === Mode.DRAWING) {
			canvas.addEventListener('pointerdown', startDraw);
			canvas.addEventListener('pointermove', draw);
			canvas.addEventListener('pointerup', endDraw);
			canvas.addEventListener('pointerleave', endDraw);
		} else {
			canvas.removeEventListener('pointerdown', startDraw);
			canvas.removeEventListener('pointermove', draw);
			canvas.removeEventListener('pointerup', endDraw);
			canvas.removeEventListener('pointerleave', endDraw);
		}
	})

	function startDraw(e: PointerEvent) {
		e.preventDefault();

		if (currentTool.type === StrokeToolType.PEN) {
			isDrawing = true;

			currentStroke = {
				id: uuidv4(),
				color: currentTool.color,
				width: currentTool.width,
				points: []
			};

			const point = getPoint(e);
			currentStroke.points.push(point, point);
		} else if (currentTool.type === StrokeToolType.ERASER) {
			isErasing = true;

			const point = getPoint(e);
			erasingPoint1 = point;
			erasingPoint2 = point;
		}
	}

	function draw(e: PointerEvent) {
		const point = getPoint(e);

		if (isDrawing && currentStroke && ctx) {
			currentStroke.points.push(point);

			// Draw only the latest segment (fast)
			drawSmoothSegment(ctx, currentStroke);
		} else if (isErasing && erasingPoint1 && erasingPoint2) {
			erasingPoint1 = erasingPoint2;
			erasingPoint2 = point;

			$strokesStore.entries().forEach((s: [number, Stroke], strokeIndex: number) => {
				let stroke = s[1];
				
				stroke.points.forEach((point: StrokePoint, pointIndex: number, points: StrokePoint[]) => {
					if ( pointIndex !== 0) {
						const p0 = points[pointIndex - 1];
						if (line2lineIntersecting(p0, point, erasingPoint1!, erasingPoint2!)) {
							getStrokes().delete(strokeIndex) // TODO: probably not ideal to do this like this...
						}
					}
				})
			})
		}
	}

	function endDraw() {
		if (isDrawing) {
			isDrawing = false;

			// Push to Yjs
			getStrokes().push([currentStroke]);

			currentStroke = null;
		} else if (isErasing) {
			isErasing = false;

			erasingPoint1 = null;
			erasingPoint2 = null;
		}
	}

	function getPoint(e: PointerEvent): StrokePoint {
		const rect = canvas.getBoundingClientRect();

		return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
			pressure: e.pressure * 1.5 || 1.5
		}
	}

	function drawSmoothSegment(ctx: CanvasRenderingContext2D, stroke: Stroke) {
		const points = stroke.points;
		const len = points.length

		if (len < 3) {
			// fallback for first points
			const p1 = points[len - 2]
			const p2 = points[len - 1]

			ctx.beginPath()
			ctx.moveTo(p1.x, p1.y)
			ctx.lineTo(p2.x, p2.y)
			ctx.stroke()
			return
		}

		const p0 = points[len - 3]
		const p1 = points[len - 2]
		const p2 = points[len - 1]

		const mid1 = {
			x: (p0.x + p1.x) / 2,
			y: (p0.y + p1.y) / 2
		}

		const mid2 = {
			x: (p1.x + p2.x) / 2,
			y: (p1.y + p2.y) / 2
		}

		ctx.beginPath()
		ctx.moveTo(mid1.x, mid1.y)
		ctx.quadraticCurveTo(p1.x, p1.y, mid2.x, mid2.y)

		ctx.strokeStyle = stroke.color
		ctx.lineWidth = stroke.width * p2.pressure
		ctx.lineCap = 'round'
		ctx.lineJoin = 'round'

		ctx.stroke()
	}

	function redrawCanvas() {
		if (!ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height)

		$strokesStore.entries().forEach((s) => {
			if (!ctx) return;
			let stroke = s[1] as unknown as Stroke;
			drawStroke(ctx, stroke);
		})
	}

	function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
		const points = stroke.points

		if (points.length < 2) return

		ctx.beginPath()
		ctx.moveTo(points[0].x, points[0].y)

		for (let i = 1; i < points.length - 1; i++) {
			const p0 = points[i]
			const p1 = points[i + 1]

			const mid = {
			x: (p0.x + p1.x) / 2,
			y: (p0.y + p1.y) / 2
			}

			ctx.quadraticCurveTo(p0.x, p0.y, mid.x, mid.y)
		}

		ctx.strokeStyle = stroke.color
		ctx.lineWidth = stroke.width
		ctx.lineCap = 'round'
		ctx.lineJoin = 'round'

		ctx.stroke()
	}

	// Source - https://stackoverflow.com/a/31704928 Posted by markE Retrieved 2026-03-27, License - CC BY-SA 3.0
	function line2lineIntersecting(p0: StrokePoint, p1: StrokePoint, p2: StrokePoint, p3: StrokePoint): Boolean {

		let unknownA 		= (p3.x-p2.x) * (p0.y-p2.y) - (p3.y-p2.y) * (p0.x-p2.x);
		let unknownB 		= (p1.x-p0.x) * (p0.y-p2.y) - (p1.y-p0.y) * (p0.x-p2.x);
		const denominator  	= (p3.y-p2.y) * (p1.x-p0.x) - (p3.x-p2.x) * (p1.y-p0.y);        

		// Test if Coincident
		// If the denominator and numerator for the ua and ub are 0
		//    then the two lines are coincident.    
		if (unknownA == 0 && unknownB == 0 && denominator == 0) return false;

		// Test if Parallel 
		// If the denominator for the equations for ua and ub is 0
		//     then the two lines are parallel. 
		if (denominator == 0) return false;

		// If the intersection of line segments is required 
		// then it is only necessary to test if ua and ub lie between 0 and 1.
		// Whichever one lies within that range then the corresponding
		// line segment contains the intersection point. 
		// If both lie within the range of 0 to 1 then 
		// the intersection point is within both line segments. 
		unknownA /= denominator;
		unknownB /= denominator;

		if(!(unknownA >= 0 && unknownA <= 1 && unknownB >= 0 && unknownB <= 1)) return false;

		return true;
	}
</script>

<canvas id="canvas" bind:this={canvas}></canvas>
<Toolbar bind:currentTool></Toolbar>

<style>
	#canvas {
		position: fixed;
		top: 0;
		left: 0;
		margin: 0;
		touch-action: none;
		pointer-events: auto;
		z-index: 0;
	}
</style>