import { writable } from "svelte/store";
import { browser } from '$app/environment';
import { getNotes, getStrokes } from "$lib/sync/provider";
import type { Stroke } from "$lib/types";

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

export function createStrokesStore() {
    if (!browser) {
        return writable(new Map());
    }

    const yarray = getStrokes();
    const { subscribe, set } = writable<Array<Stroke>>(
        yarray.toArray() as Stroke[]
    );
    yarray.observe(() => set(yarray.toArray() as Stroke[]));
    return { subscribe };
}

export const notesStore     = createNotesStore();
export const strokesStore   = createStrokesStore();