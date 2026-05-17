<script lang="ts">
    import { env } from "$env/dynamic/public";
    import AddRoomCard from "$lib/components/rooms/AddRoomCard.svelte";
    import DeleteRoomModal from "$lib/components/rooms/DeleteRoomModal.svelte";
    import RoomCard from "$lib/components/rooms/RoomCard.svelte";
    import { getSession, verifySession, type User } from "$lib/guards/user";
    import { getErrors } from "$lib/shared";
    import type { Room } from "$lib/types";
    import Icon from "@iconify/svelte";
    import { onMount } from "svelte";

	let rooms = $state<Room[]>([]);
	let isLoading = $state(false);
	let errorMessage = $state("");

	let roomToDelete: Room | null = $state(null);
	let dialog: HTMLDialogElement | undefined = $state(undefined);
	let user: User | null = $state(null);


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

	onMount(async () => {
		await fetchRooms();
		if (await verifySession()) {
			user = await getSession(); // user must be valide now
		}
	});
</script>

<button id="refresh" onclick={fetchRooms}>
	{#if isLoading}
		<Icon icon="tabler:loader-2" class="spin" aria-hidden="true" />
		Loading...
	{:else}
		<Icon icon="tabler:refresh" aria-hidden="true" />
		Refresh
	{/if}
</button>

{#if errorMessage}
	<p>{@html errorMessage}</p>
{/if}

<div id="room-cards">
	{#each rooms as room (room.name)}
		<RoomCard room={room} user={user!} onDeleteRequest={(r) => { roomToDelete = r; dialog!.showModal(); }}></RoomCard>
	{/each}
	<AddRoomCard refreshRooms={fetchRooms}></AddRoomCard>
</div>

<DeleteRoomModal bind:dialog room={roomToDelete} onClose={() => { dialog!.close(); roomToDelete = null; }} refreshRooms={fetchRooms}></DeleteRoomModal>

<style>
	#refresh {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	#room-cards {
		padding: 2em;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 2em;
	}
</style>