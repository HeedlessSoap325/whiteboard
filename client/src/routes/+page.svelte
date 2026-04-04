<script lang="ts">
    import { onMount } from "svelte";
	import { browser } from '$app/environment';
    import { getPresence } from "$lib/sync/provider";
    import CanvasLayer from "$lib/components/layers/Canvas.svelte";

    let states = $state<any[]>([]);

    onMount(() => {
        const presence = getPresence();
        presence.setLocalStateField("name", crypto.randomUUID());

        const handler = () => {
            states = Array.from(presence.getStates().entries())
                .filter(([id]) => id !== presence.clientID);
			console.log(states)
        };

        presence.on("change", handler);
        return () => presence.off("change", handler);
    });
</script>

<CanvasLayer></CanvasLayer>