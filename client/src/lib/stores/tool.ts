import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { StrokeTool } from "$lib/types";

function createToolsStore() {
	const key = "tools";

	let initial: StrokeTool[] = [];

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