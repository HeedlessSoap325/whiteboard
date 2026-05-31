import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { Mode, StrokeToolType, type StrokeTool } from "$lib/types";

function createToolsStore() {
	const key = "tools";

	const defaultTools: StrokeTool[] = [
		{type: StrokeToolType.PEN, color: "#ff0000", width: 2, positionIndex: 0, selected: false},
		{type: StrokeToolType.PEN, color: "#00ff00", width: 2, positionIndex: 1, selected: false},
		{type: StrokeToolType.PEN, color: "#0000ff", width: 2, positionIndex: 2, selected: false},
		{type: StrokeToolType.ERASER, color: "#ffffff", width: 2, positionIndex: 3, selected: true},
	];

	let initial: StrokeTool[] = defaultTools;

	if (browser) {
		const item = localStorage.getItem(key);
		if (item) initial = JSON.parse(item);
	}

	const store = writable<StrokeTool[]>(initial);

	if (browser) {
		store.subscribe(value => {
			localStorage.setItem(key, JSON.stringify(value));
		});
	}

  return store;
}

export const toolsStore = createToolsStore();
export const modeStore 	= writable<Mode>(Mode.MOUSE);