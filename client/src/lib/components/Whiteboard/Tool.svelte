<script lang="ts">
    import ArrowSVG from "$lib/assets/ArrowSVG.svelte";
    import EraserSVG from "$lib/assets/EraserSVG.svelte";
    import PenSVG from "$lib/assets/PenSVG.svelte";
    import { toolsStore } from "$lib/stores/tool";
    import { StrokeToolType, type StrokeTool } from "$lib/types";

	let {tool, toolIndex, currentTool = $bindable()}: {tool: StrokeTool, toolIndex: number, currentTool: StrokeTool} = $props();

	let popoverOpen = $state(false);

	// svelte-ignore state_referenced_locally
	let color = $state(tool.color);
	// svelte-ignore state_referenced_locally
	let width = $state(tool.width);
	
	$effect(() => {
		toolsStore.update(tools =>
			tools.map(t => {
				if (t.positionIndex === toolIndex){
					const newTool = { ...t, color: color, width: width };
					currentTool = newTool;
					return newTool;
				}
				return t
			})
		);
	})
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class={`tool ${tool.positionIndex === currentTool.positionIndex ? 'selected' : ''}`} role="button" tabindex="0" onclick={() => {currentTool = tool}}>
	{#if tool.positionIndex === currentTool.positionIndex && tool.type === StrokeToolType.PEN}
		<div  class="tool-popover" role="button" tabindex="0" onclick={() => {popoverOpen = !popoverOpen}}>
			<ArrowSVG color="#000000" width="15px" height="15px"></ArrowSVG>
		</div>
	{/if}
	
	{#if tool.type === StrokeToolType.PEN}
		<PenSVG color={tool.color} width="75px" height="75px"></PenSVG>
	{/if}
	{#if tool.type === StrokeToolType.ERASER}
		<EraserSVG width="60px" height="60px"></EraserSVG>
	{/if}

	{#if popoverOpen}
    <div class="popover">
		<label>
			Width
			<input type="range" min="1" max="10" bind:value={width} />
		</label>

		<label>
			Color
			<input type="color" bind:value={color} />
		</label>
    </div>
  {/if}
</div>	

<style>
	.tool {
		cursor: pointer;
		position: relative;
	}

	.popover {
		position: absolute;
		bottom: 110%;
		left: 0;
		background: white;
		border: 1px solid #ccc;
		padding: 8px;
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		z-index: 20;
	}

	.tool-popover {
		position: fixed;
		z-index: 20;
	}

	.tool.selected {
		background-color: blue;
	}

	.tool:hover {
		background-color: red;
	}
</style>