<script lang="ts">
	import type { Stroke, StrokePoint } from "$lib/types";
    import { getStrokes } from "$lib/sync/provider";
	import { onMount } from "svelte";
    import { strokesStore } from "$lib/stores/whiteboard";

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;

	let isDrawing = false;
	let currentStroke: Stroke | null = null;

	onMount(() => {
		canvas.width = window.innerWidth;
    	canvas.height = window.innerHeight;

		ctx = canvas.getContext("2d");

		canvas.addEventListener('pointerdown', startDraw);
		canvas.addEventListener('pointermove', draw);
		canvas.addEventListener('pointerup', endDraw);
		canvas.addEventListener('pointerleave', endDraw);

		getStrokes().observe(redrawCanvas);
	});

	function startDraw(e: PointerEvent) {
		e.preventDefault();

		isDrawing = true;

		currentStroke = {
			id: crypto.randomUUID(),
			color: '#000',
			width: 2,
			points: []
		};

		const point = getPoint(e);
		currentStroke.points.push(point, point);
	}

	function draw(e: PointerEvent) {
		if (!isDrawing || !currentStroke || !ctx) return;

		const point = getPoint(e);
		currentStroke.points.push(point);

		// Draw only the latest segment (fast)
		drawSmoothSegment(ctx, currentStroke);
	}

	function endDraw() {
		if (!isDrawing) return;

		isDrawing = false;

		// Push to Yjs
		getStrokes().push([currentStroke]);

		currentStroke = null;
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
			console.log(s)
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
</script>

<canvas id="canvas" bind:this={canvas}></canvas>

<style>
	#canvas {
		position: absolute;
		top: 0;
		left: 0;
		margin: 0;
		touch-action: none;
	}
</style>