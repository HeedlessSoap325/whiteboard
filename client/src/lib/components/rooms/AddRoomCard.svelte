<script>
    import Icon from "@iconify/svelte";
    import AddRoomModal from "./AddRoomModal.svelte";

	const { refreshRooms } = $props();

	let showModal = $state(false);
</script>

<div id="room" class="room-card">
	<button id="btn" onclick={() => showModal = true}>
		<Icon icon="tabler:plus" aria-hidden="true"/>
	</button>
</div>

<AddRoomModal bind:showModal refreshRooms={refreshRooms}></AddRoomModal>

<style>
	.room-card {
        background: white;
        border: 2px dashed #d8d8d8;
        border-radius: 12px;
        padding: 2em;
        display: flex;
        align-items: center;
		justify-content: center;
        gap: 14px;
        transition: border-color 0.15s, box-shadow 0.15s;
        max-width: 238px;
        min-width: 238px;
		min-height: 110px;
		max-height: 110px;
    }

    .room-card:hover {
        border-color: #d0d0d0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

	#btn {
		border: none;
		outline: none;
		cursor: pointer;
		transform: scale(3);
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: white;
		border-radius: 50%;
		padding: 0.25em;
	}

	#btn:hover {
		background-color: #ededed;
	}
</style>