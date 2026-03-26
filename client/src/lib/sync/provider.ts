import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { env } from '$env/dynamic/public';
import { browser } from '$app/environment';

const globalAny = globalThis as any;

function getProvider(): { doc: Y.Doc; provider: WebsocketProvider } {
    // Never run on the server
    if (!browser) {
        throw new Error("YJS provider accessed outside the browser");
    }

    if (!globalAny.__yInstance) {
        const doc = new Y.Doc();
        const provider = new WebsocketProvider(
            `ws://${env.PUBLIC_SERVER_BASE || "localhost"}:${env.PUBLIC_SERVER_PORT || "1999"}`,
            "my-room",
            doc,
            { connect: false }
        );
        provider.connect();
        globalAny.__yInstance = { doc, provider };
    }

    return globalAny.__yInstance;
}

// Lazy exports — only evaluated in the browser
export const getDoc         = () => getProvider().doc;
export const getPresence    = () => getProvider().provider.awareness;
export const getNotes       = () => getProvider().doc.getMap("notes");
export const getStrokes     = () => getProvider().doc.getArray("strokes");