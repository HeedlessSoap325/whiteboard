<script lang="ts">
    import { env } from "$env/dynamic/public";
    import { getErrors } from "$lib/shared";
    import type { Room } from "$lib/types";
    import { onMount } from "svelte";

	let rooms = $state<Room[]>([]);
	let isLoading = $state(false);
	let errorMessage = $state("");

	async function fetchRooms() {
		isLoading = true;
        errorMessage = "";

		try {
			const response = await fetch(`http://${env.PUBLIC_SERVER_BASE}:${env.PUBLIC_SERVER_PORT}/room/`, {
				method: "GET",
				credentials: "include",
			});

			const data = await response.json();

			if (!response.ok) {
				errorMessage = getErrors(data) ?? "Loading failed";
                return;
			}

			rooms = data;
		} catch (err) {
			console.log(err)
            errorMessage = "Network error, please try again.";
        } finally {
            isLoading = false;
        }
	}

	onMount(fetchRooms);
</script>

<button onclick={fetchRooms}>{isLoading ? "Loading..." : "Refresh"}</button>

{#if errorMessage}
	<p>{@html errorMessage}</p>
{/if}

{#each rooms as room (room.name)}
	<h1>{room.name}</h1>
{/each}