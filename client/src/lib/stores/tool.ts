import { browser } from '$app/environment';
import type { StrokeTool } from "$lib/types";

export function createToolsStore() {
    let value = $state<Array<StrokeTool>>();
	const key = "tools";
  
	value = [];
  
	if (browser) {
		const item = localStorage.getItem(key);
		if (item) value = JSON.parse(item);
	}
  
	$effect(() => {
		localStorage.setItem(key, JSON.stringify(value));
	});

	return value;
}

export const toolsStore = createToolsStore();