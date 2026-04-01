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
		display: flex;
		flex-direction: row;
		align-items: center;
		bottom: 20px;
		z-index: 10;
		background-color: aqua;
		padding-inline: 50px;

		gap: 20px;
	}
</style>