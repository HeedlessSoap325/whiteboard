<script lang="ts">
    import { modeStore } from "$lib/stores/tool";
    import { notesStore } from "$lib/stores/whiteboard";
    import { getNotes } from "$lib/sync/provider";
    import { Mode, type Note } from "$lib/types";

	let lastClick = $state(0);
	let editingId = $state("");
	let editTextarea: HTMLTextAreaElement | null = $state(null);

	$effect(() => {
		if ($modeStore === Mode.MOUSE) {
			window.addEventListener("pointerdown", handlePointerDown);
		} else {
			editingId = "";
			editTextarea?.remove();
			window.removeEventListener("pointerdown", handlePointerDown);
		}
	})

	
	$effect(() => {
		if (!editTextarea) return;
		editTextarea.focus();
		
		editTextarea.addEventListener("focus", () => {
			editTextarea?.addEventListener("blur", () => {
				editingId = "";
			});
		});
	})


	function handlePointerDown(e: PointerEvent) {
		const now = Date.now();
		const isDoubleClick = now - lastClick < 300;
		lastClick = now;

		if (isDoubleClick) {
			createTextAt(e.clientX, e.clientY);
		}
	}

	function createTextAt(x: number, y: number) {
		const textId = crypto.randomUUID();
		editingId = textId;

		const note = {
			id: textId,
			x, y,
			content: "",
		}
		getNotes().push([note]);

		console.log($notesStore)
	}

	function updateNote(content: string) {
		const yarray = getNotes();
		const index = yarray.toArray().findIndex((n: any) => n.id == editingId);

		if (index !== -1) {
			const note = yarray.get(index) as Note;
			note.content = content;

			yarray.delete(index, 1);
			yarray.insert(index, [note]);
		}
	}
</script>

<div id="text-layer">
    {#each $notesStore as text}
		{#if editingId === text.id}
			<textarea 
				bind:this={editTextarea}
				style="transform: translate({text.x}px, {text.y}px)"
				oninput={(e) => updateNote(e.target!.value)}
			>{text.content}</textarea>
		{:else}
			<div class="text-item" style="transform: translate({text.x}px, {text.y}px)">
				{text.content}
			</div>
		{/if}	
    {/each}
</div>

<style>
	#text-layer {
		width: 100vw;
		height: 100vh;
	}

	.text-item {
		position: absolute;
		cursor: move;
	}

	.text-item:hover {
		outline: 1px dashed #888;
	}
</style>