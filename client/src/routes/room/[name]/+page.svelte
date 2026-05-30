<script lang="ts">
    import { onMount } from "svelte";
	import { browser } from '$app/environment';
    import { destroyProvider, getPresence } from "$lib/sync/provider";
    import Whiteboard from "$lib/components/layers/Whiteboard.svelte";
    import { modeStore } from "$lib/stores/tool";
    import { Mode } from "$lib/types";

    let states = $state<any[]>([]);
    let prevMode = $state<Mode | null>(null);

    onMount(() => {
        window.addEventListener("pointermove", handlePointerDeviceInteractionStart);
        window.addEventListener("pointerdown", handlePointerDeviceInteractionStart);
        window.addEventListener("pointerup",   handlePointerDeviceInteractionEnd);

        const presence = getPresence();
        presence.setLocalStateField("name", crypto.randomUUID());

        const handler = () => {
            states = Array.from(presence.getStates().entries())
                .filter(([id]) => id !== presence.clientID);
			console.log(states)
        };

        presence.on("change", handler);
        
        return () => {
            window.removeEventListener("pointermove", handlePointerDeviceInteractionStart);
            window.removeEventListener("pointerdown", handlePointerDeviceInteractionStart);
            window.removeEventListener("pointerup",   handlePointerDeviceInteractionEnd);

            presence.off("change", handler);
            destroyProvider();
        }
    });

    function handlePointerDeviceInteractionStart(e: PointerEvent) {
        prevMode = $modeStore;

        let newMode;
        switch (e.pointerType) {
            case "mouse": newMode = Mode.MOUSE;   break;
            case "pen":   newMode = Mode.DRAWING; break;
            default:      newMode = Mode.MOUSE;   break;
        }

        if($modeStore !== newMode) modeStore.set(newMode);
    }

    function handlePointerDeviceInteractionEnd() {
        if (!prevMode) return;
        modeStore.set(prevMode);
    }
</script>

<Whiteboard/>