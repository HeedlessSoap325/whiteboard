import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { env } from '$env/dynamic/public';
import { browser } from '$app/environment';
import { page } from "$app/state";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";

const globalAny = globalThis as unknown as {
    __yInstance : {
        roomId: string,
        provider: WebsocketProvider,
        doc: Y.Doc,
    }
};

export function getProvider(): { doc: Y.Doc; provider: WebsocketProvider } {
    // Never run on the server
    if (!browser) {
        throw new Error("YJS provider accessed outside the browser");
    }

    const currentRoomId = page.params.name || "default";
    if(!globalAny.__yInstance || globalAny.__yInstance.roomId !== currentRoomId) {
        setRoom(currentRoomId);
    }

    if (!globalAny.__yInstance) {
        throw new Error("Tried to access provider without setting roomId first");
    }

    return globalAny.__yInstance;
}

function setRoom(roomId: string) {
    // Never run on the server
    if (!browser) {
        throw new Error("YJS provider accessed outside the browser");
    }

    if(globalAny.__yInstance) {
        globalAny.__yInstance.provider.destroy();
        globalAny.__yInstance.doc.destroy();
    }

    const doc = new Y.Doc();
    const provider = new WebsocketProvider(
        `ws://${env.PUBLIC_SERVER_BASE || "localhost"}:${env.PUBLIC_SERVER_PORT || "1999"}`,
        roomId,
        doc,
        { connect: false }
    );
    
    provider.connect();
    globalAny.__yInstance = { doc, provider, roomId };

    provider.on("connection-close", (ev) => {
        console.log(ev)
        if(ev && ev.code === 1006) {
            if(globalAny.__yInstance) {
                globalAny.__yInstance.provider.destroy();
                globalAny.__yInstance.doc.destroy();
            }
            goto(resolve("/"));
        }
    });
}

export function destroyProvider() {
    if(globalAny.__yInstance) {
        globalAny.__yInstance.provider.destroy();
        globalAny.__yInstance.doc.destroy();
    }
}

// Lazy exports — only evaluated in the browser
export const getDoc         = () => getProvider().doc;
export const getPresence    = () => getProvider().provider.awareness;
export const getNotes       = () => getProvider().doc.getArray("notes");
export const getStrokes     = () => getProvider().doc.getArray("strokes");