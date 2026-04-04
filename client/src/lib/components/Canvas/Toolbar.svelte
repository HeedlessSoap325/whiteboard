<script lang="ts">
    import { toolsStore } from "$lib/stores/tool";
    import { StrokeToolType, type StrokeTool } from "$lib/types";
    import Tool from "./Tool.svelte";

	const defaultTools: StrokeTool[] = [
		{type: StrokeToolType.PEN, color: "#ff0000", width: 2, positionIndex: 0},
		{type: StrokeToolType.PEN, color: "#00ff00", width: 2, positionIndex: 1},
		{type: StrokeToolType.PEN, color: "#0000ff", width: 2, positionIndex: 2},
		{type: StrokeToolType.ERASER, color: "#ffffff", width: 2, positionIndex: 3},
	]

	let {currentTool = $bindable()}: {currentTool: StrokeTool} = $props();

	if ($toolsStore.length === 0) {
		toolsStore.set(defaultTools);
	}
</script>

<div id="toolbar-container">
	{#each $toolsStore as tool, index}
		<Tool bind:currentTool tool={tool} toolIndex={index}></Tool>
	{/each}
</div>

<style>
	#toolbar-container {
		position: fixed;
		left: 50%;
		transform: translateX(-50%);
		bottom: 20px;

		display: flex;
		align-items: center;
		gap: 16px;

		padding: 12px 20px;

		background: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(10px);

		border-radius: 16px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

		z-index: 20;

		padding-inline: 50px;
	}
</style>