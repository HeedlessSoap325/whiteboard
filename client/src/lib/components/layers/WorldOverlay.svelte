<script lang="ts">
    import { modeStore } from "$lib/stores/tool";
    import { notesStore } from "$lib/stores/whiteboard";
    import { getNotes } from "$lib/sync/provider";
    import { Mode, type Note } from "$lib/types";
    import { getContext, onMount } from "svelte";

	const { screenToWorld, transform } = getContext("viewport");

	let lastClick = $state(0);
	let editingId = $state("");
	let dragging: Note | null = $state(null);

	onMount(() => {
		return () => {
			window.removeEventListener("mousedown", handleMouseDown);
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		}
	});

	$effect(() => {
		if ($modeStore === Mode.MOUSE) {
			window.addEventListener("mousedown", handleMouseDown);
			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", onMouseUp);
		} else {
			editingId = "";
			window.removeEventListener("mousedown", handleMouseDown);
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		}
	})

	function handleMouseDown(e: MouseEvent) {
		const now = Date.now();
		const isDoubleClick = now - lastClick < 300;
		lastClick = now;

		if (isDoubleClick) {
			e.preventDefault();
			createTextAt(e);
		}
	}

	function createTextAt(e: MouseEvent) {
		const textId = crypto.randomUUID();
		const worldPos = screenToWorld(e.clientX, e.clientY);

		const note = {
			id: textId,
			x: worldPos.x, 
			y: worldPos.y,
			content: "",
		}
		getNotes().push([note]);

		editingId = textId;
	}

	function updateNote(id: string, updater: (note: Note) => Partial<Note>) {
		const yarray = getNotes();
		const index = yarray.toArray().findIndex((n: any) => n.id == id);

		if (index !== -1) {
			const note = yarray.get(index) as Note;
			const notePart = updater(note);
			const newNote = { ...note, ...notePart }

			yarray.delete(index, 1);
			yarray.insert(index, [newNote]);
		}
	}

	function deleteNote(id: string) {
		const yarray = getNotes();
		const index = yarray.toArray().findIndex((n: any) => n.id == id);

		if (index !== -1) {
			yarray.delete(index, 1);
		}
	}

	function finishNoteUpdate(id: string, newContent: string) {
		if (newContent.trim() === "") {
			deleteNote(id);
		} else {
			updateNote(editingId, () => ({ content: newContent }));
		}
		
		editingId = "";
	}

	function onMouseDown(e: MouseEvent, id: string) {
		e.preventDefault(); // Prevent text from getting highlighted
		if ($modeStore !== Mode.MOUSE) return;
		
		editingId = id;
		dragging = {
			id,
			x: e.clientX,
			y: e.clientY,
			content: "",
		};
	}

	function onMouseMove(e: MouseEvent) {
		if (!dragging) return;

		const worldPos = screenToWorld(e.clientX, e.clientY);

		updateNote(dragging.id, (note) => ({
			x: worldPos.x,
			y: worldPos.y,
		}));

		dragging.x = e.clientX;
		dragging.y = e.clientY;
	}

	function onMouseUp() {
		dragging = null;
	}
</script>

<div id="text-layer" style={`transform: ${transform()}`}>
    {#each $notesStore as text}
		{#if editingId === text.id}
			<textarea
				onblur={(e) => {finishNoteUpdate(text.id, e.target!.value)}}
				onpointerdown={(e) => {e.stopPropagation();}}
				style="left: {text.x}px; top: {text.y}px; position: absolute;"
			>{text.content}</textarea>
		{:else}
			<div class:movable={$modeStore === Mode.MOUSE} role="cell" tabindex="0" onmousedown={(e) => onMouseDown(e, text.id)} class="text-item" style="left: {text.x}px; top: {text.y}px; position: absolute;">
				{text.content}
			</div>
		{/if}	
    {/each}
</div>

<style>
	#text-layer {
		position: absolute;
		inset: 0;
		width: 100vw;
		height: 100vh;
		transform-origin: 0 0;
	}

	.text-item, textarea {
        position: absolute;
        cursor: text;
    }

	.text-item {
        position: absolute;
        cursor: none;
		pointer-events: all;
    }

	.text-item.movable {
        position: absolute;
        cursor: move;
    }

	.text-item.movable:hover {
		outline: 1px dashed #888;
	}
</style>