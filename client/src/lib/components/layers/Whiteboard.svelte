<script lang="ts">
    import { setContext } from "svelte";
    import WorldCanvas from "./WorldCanvas.svelte";
    import WorldOverlay from "./WorldOverlay.svelte";
    import ScreenOverlay from "./ScreenOverlay.svelte";
    import type { PanState, ViewportContext } from "$lib/types";

	let pan  = $state<PanState>({ x: 0, y: 0 });
	let zoom = $state<number>(1);

	let isPanning = false;
	let lastPos: PanState = { x: 0, y: 0 };

	const maxScaleFactor = 3;

	const transform = $derived(`translate(${pan.x}px, ${pan.y}px) scale(${zoom})`);

	function screenToWorld(screenX: number, screenY: number): PanState {
		return {
			x: (screenX - pan.x) / zoom,
			y: (screenY - pan.y) / zoom,
		};
	}

	function worldToScreen(worldX: number, worldY: number): PanState {
		return {
			x: worldX * zoom + pan.x,
			y: worldY * zoom + pan.y,
		};
	}

	setContext<ViewportContext>("viewport", {pan: () => pan, zoom: () => zoom, transform: () => transform, screenToWorld, worldToScreen});

	function onPointerDown(event: PointerEvent) {
		if (event.button === 1 || (event.button === 0 && event.altKey)) { // middle click or alt+drag, TODO: find a easier way to do this
			isPanning = true;
			lastPos = { x: event.clientX, y: event.clientY };
			event.preventDefault();
		}
	}

	function onPointerMove(event: PointerEvent) {
		if (!isPanning) return;

		const dx = event.clientX - lastPos.x;
		const dy = event.clientY - lastPos.y;

		pan = { x: pan.x + dx, y: pan.y + dy };
		lastPos = { x: event.clientX, y: event.clientY };
	}

	function onPointerUp() {
		isPanning = false;
	}

	function onWheel(event: WheelEvent) {
		event.preventDefault();
		const factor = event.deltaY < 0 ? 1.1 : 0.9;

		                                   /* @ts-ignore */
		const rect   = event.currentTarget!.getBoundingClientRect();
		const sx     = event.clientX - rect.left;
		const sy     = event.clientY - rect.top;

		const newZoom = Math.min(Math.max(zoom * factor, 0.1), maxScaleFactor);
		
		pan = {
			x: sx - (sx - pan.x) * (newZoom / zoom),
			y: sy - (sy - pan.y) * (newZoom / zoom),
		};
		
		zoom = newZoom;
	}
</script>

<div
	id="whiteboard"
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointerleave={onPointerUp}
	onwheel={onWheel}
	aria-hidden="true"
>
	<WorldCanvas/>
	<WorldOverlay/>
	<ScreenOverlay/>
</div>

<style>
	#whiteboard { 
		position: relative; 
		width: 100dvw; 
		height: 100dvh; 
		overflow: hidden; 
	}
</style>