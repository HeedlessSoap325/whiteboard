import { writable } from "svelte/store";
import { browser } from '$app/environment';
import { page } from "$app/stores";
import { getNotes, getProvider, getStrokes } from "$lib/sync/provider";
import type { Note, Stroke } from "$lib/types";
import type { Array as YArray } from "yjs";

function createYArrayStore<T>(getArray: () => YArray<unknown>) {
    const { subscribe, set } = writable<T[]>([]);

    if (!browser) return { subscribe };

    let activeArray: YArray<unknown> | null = null;
    let activeObserver: (() => void) | null = null;

    function reattach() {
        if (activeObserver && activeArray) {
            activeArray.unobserve(activeObserver);
        }
    
        const arr = getArray();
        activeArray = arr;
        activeObserver = () => { set(arr.toArray() as T[]); };
    
        arr.observe(activeObserver);
    
        set(arr.toArray() as T[]);
    }

    page.subscribe(($page) => {
        if ($page.params?.name) {
            reattach(); 
        }
    });
    getProvider().provider.on("sync", () => reattach())

    return { subscribe };
}

export const notesStore   = createYArrayStore<Note>(() => getNotes());
export const strokesStore = createYArrayStore<Stroke>(() => getStrokes());