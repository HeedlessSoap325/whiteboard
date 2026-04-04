import { writable } from "svelte/store";
import { browser } from '$app/environment';
import { getNotes, getStrokes } from "$lib/sync/provider";
import type { Note, Stroke } from "$lib/types";

export function createNotesStore() {
    if (!browser) {
        return writable(new Array<Note>());
    }

    const yarray = getNotes();
    const { subscribe, set } = writable<Array<Note>>(
        yarray.toArray() as Note[]
    );
    yarray.observe(() => set(yarray.toArray() as Note[]));
    return { subscribe };
}

export function createStrokesStore() {
    if (!browser) {
        return writable(new Array<Stroke>());
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