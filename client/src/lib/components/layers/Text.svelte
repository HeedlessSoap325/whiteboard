<script lang="ts">
    import { modeStore } from "$lib/stores/tool";
    import { notesStore } from "$lib/stores/whiteboard";
    import { getNotes } from "$lib/sync/provider";
    import { Mode, type Note } from "$lib/types";

	let lastClick = $state(0);
	let editingId = $state("");
	let dragging: Note | null = $state(null);

	$effect(() => {
		if ($modeStore === Mode.MOUSE) {
			window.addEventListener("pointerdown", handlePointerDown);
			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", onMouseUp);
		} else {
			editingId = "";
			window.removeEventListener("pointerdown", handlePointerDown);
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		}
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

		const note = {
			id: textId,
			x, y,
			content: "",
		}
		getNotes().push([note]);

		editingId = textId;

		console.log($notesStore)
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

	function onMouseDown(e: MouseEvent, id: string) {
		e.preventDefault(); // Prevent text from getting highlighted

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

		updateNote(dragging.id, (note) => ({
			x: note.x + e.clientX - dragging.x,
			y: note.y += e.clientY - dragging.y,
		}));

		dragging.x = e.clientX;
		dragging.y = e.clientY;
	}

	function onMouseUp() {
		dragging = null;
	}
</script>

<div id="text-layer">
    {#each $notesStore as text (text.id)}
		{#if editingId === text.id}
			<textarea
				onblur={() => {editingId = "";}}
				onpointerdown={(e) => {e.stopPropagation();}}
				style="transform: translate({text.x}px, {text.y}px)"
				oninput={(e) => updateNote(text.id, () => ({content: e.target!.value}))}
			>{text.content}</textarea>
		{:else}
			<div role="cell" tabindex="0" onmousedown={(e) => onMouseDown(e, text.id)} class="text-item" style="transform: translate({text.x}px, {text.y}px)">
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