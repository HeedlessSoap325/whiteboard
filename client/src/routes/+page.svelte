<script lang="ts">
    import { env } from "$env/dynamic/public";
    import type { Room } from "$lib/types";
    import { onMount } from "svelte";

	let rooms = $state<Room[]>([]);

	onMount(async () => {
		const response = await fetch(`http://${env.PUBLIC_SERVER_BASE}:${env.PUBLIC_SERVER_PORT}/room/`, {
                method: "GET",
				credentials: "include",
            });

        const data = await response.json();
		rooms = data;
	});
</script>

<h1>List of Rooms (at least in the future)</h1>

{#each rooms as room (room.name)}
	<h1>{room.name}</h1>
{/each}