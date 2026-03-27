<script lang="ts">
    import { StrokeToolType, type StrokeTool } from "$lib/types";

	let {currentTool = $bindable()}: {currentTool: StrokeTool} = $props();

	currentTool = {
		color: '#ff0000',
		width: 2,
		type: StrokeToolType.PEN,
		positionIndex: -1,
	}
</script>