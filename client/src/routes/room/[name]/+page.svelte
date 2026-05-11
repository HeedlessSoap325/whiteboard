<script lang="ts">
    import { onMount } from "svelte";
	import { browser } from '$app/environment';
    import { getPresence } from "$lib/sync/provider";
    import CanvasLayer from "$lib/components/layers/Canvas.svelte";
    import TextLayer from "$lib/components/layers/Text.svelte";
    import { modeStore } from "$lib/stores/tool";
    import { Mode } from "$lib/types";
    import {v4 as uuidv4} from "uuid";

    let states = $state<any[]>([]);
    let prevMode = $state<Mode | null>(null);

    onMount(() => {
        window.addEventListener("pointermove", handlePointerDeviceInteractionStart);
        window.addEventListener("pointerdown", handlePointerDeviceInteractionStart);
        window.addEventListener("pointerup",   handlePointerDeviceInteractionEnd);

        const presence = getPresence();
        presence.setLocalStateField("name", uuidv4());

        const handler = () => {
            states = Array.from(presence.getStates().entries())
                .filter(([id]) => id !== presence.clientID);
			console.log(states)
        };

        presence.on("change", handler);
        return () => presence.off("change", handler);
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

<CanvasLayer></CanvasLayer>
<TextLayer></TextLayer>