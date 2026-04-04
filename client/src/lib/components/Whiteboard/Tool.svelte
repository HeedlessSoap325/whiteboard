<script lang="ts">
    import ArrowSVG from "$lib/assets/ArrowSVG.svelte";
    import EraserSVG from "$lib/assets/EraserSVG.svelte";
    import PenSVG from "$lib/assets/PenSVG.svelte";
    import { modeStore, toolsStore } from "$lib/stores/tool";
    import { Mode, StrokeToolType, type StrokeTool } from "$lib/types";

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

	function selectTool() {
		currentTool = tool;
		modeStore.set(Mode.DRAWING)
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class={`tool ${tool.positionIndex === currentTool.positionIndex ? 'selected' : ''}`} role="button" tabindex="0" onclick={selectTool}>
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

		display: flex;
		align-items: center;
		justify-content: center;

		width: 70px;
		height: 70px;

		border-radius: 12px;
		transition: background-color 0.2s ease, transform 0.1s ease;
	}

	.tool:hover {
		background-color: rgba(0, 0, 0, 0.08);
		transform: translateY(-2px);
	}

	.tool.selected {
		background-color: rgba(0, 0, 0, 0.12);
	}

	.tool.selected:hover {
		background-color: rgba(0, 0, 0, 0.18);
	}

	.tool-popover {
		position: absolute;
		top: 4px;
		right: 4px;

		display: flex;
		align-items: center;
		justify-content: center;

		width: 20px;
		height: 20px;

		border-radius: 6px;
		background: rgba(255, 255, 255, 0.8);

		box-shadow: 0 2px 6px rgba(0,0,0,0.15);
		cursor: pointer;
	}

	.popover {
		position: absolute;
		bottom: 110%;
		left: 50%;
		transform: translateX(-50%);

		background: white;
		border: 1px solid #ddd;

		padding: 10px;
		border-radius: 10px;

		box-shadow: 0 6px 18px rgba(0,0,0,0.2);
		z-index: 20;

		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.popover input[type="range"] {
		width: 120px;
	}

	.popover input[type="color"] {
		width: 100%;
		height: 30px;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
	}
</style>