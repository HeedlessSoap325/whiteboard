import { writable } from "svelte/store";
import { browser } from '$app/environment';
import { getNotes } from "$lib/sync/provider";

export function createNotesStore() {
    if (!browser) {
        return writable(new Map());
    }

    const ymap = getNotes();
    const { subscribe, set } = writable<Map<string, unknown>>(
        new Map(ymap.entries())
    );
    ymap.observe(() => set(new Map(ymap.entries())));
    return { subscribe };
}

export const notesStore = createNotesStore();