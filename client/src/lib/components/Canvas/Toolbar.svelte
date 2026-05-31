<script lang="ts">
    import { toolsStore } from "$lib/stores/tool";
    import Tool from "./Tool.svelte";
</script>

<div id="toolbar-container">
	{#each $toolsStore as tool, index (index)}
		<Tool tool={tool} toolIndex={index}></Tool>
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