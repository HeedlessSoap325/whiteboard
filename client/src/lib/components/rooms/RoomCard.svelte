<script lang="ts">
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { type User } from "$lib/guards/user";
    import type { Room } from "$lib/types";
    import Icon from "@iconify/svelte";

	const { room, user, onDeleteRequest }: {room: Room, user: User, onDeleteRequest: (room: Room) => void} = $props();

    const activeUsersText = $derived(`${room.numActiveUsers} / ` + (room.public ? "∞" : room.allowedParticipants.length));

    async function gotoRoom() {
        await goto(resolve(`/room/${room.name}`));
    }
</script>

<div id="room" class="room-card">
    <div class="room-header">
        <h4 class="room-title">{room.name}</h4>
        <span class="room-type" class:public={room.public} class:private={!room.public}>
            {room.public ? "Public" : "Private"}
        </span>
    </div>

    <div class="room-meta">
        <Icon icon="tabler:users" aria-hidden="true"/>
        <span>{activeUsersText} active users</span>
    </div>

    <div class="room-actions">
        <button class="btn-join" onclick={gotoRoom}>
        Join <Icon icon="tabler:arrow-right" aria-hidden="true"/>
        </button>

        {#if room.owner === user?.name}
            <button class="btn-delete" aria-label="Delete room" onclick={() => onDeleteRequest(room)}>
                <Icon icon="tabler:trash" aria-hidden="true"/>
            </button>
        {/if}
    </div>
</div>

<style>
    .room-card {
        background: white;
        border: 1px solid #e8e8e8;
        border-radius: 12px;
        padding: 2em;
        display: flex;
        flex-direction: column;
        gap: 14px;
        transition: border-color 0.15s, box-shadow 0.15s;
        max-width: 240px;
        min-width: 240px;
        min-height: 110px;
        max-height: 110px;
    }

    .room-card:hover {
        border-color: #d0d0d0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .room-header {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
    }

    .room-title {
        font-size: 15px;
        font-weight: 600;
        margin: 0 0 4px;
        color: #111;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .room-type {
        font-size: 11px;
        font-weight: 500;
        padding: 2px 8px;
        border-radius: 99px;
    }

    .room-type.public  { 
        background: #dcfce7; 
        color: #166534; 
    }
    .room-type.private { 
        background: #fef9c3; 
        color: #854d0e; 
    }

    .room-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #6b7280;
    }

    .room-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        border-top: 1px solid #f0f0f0;
        padding-top: 12px;
    }

    .btn-join {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        font-size: 13px;
        font-weight: 500;
        padding: 6px 12px;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
        background: transparent;
        color: #111;
        cursor: pointer;
        transition: background 0.12s;
    }

    .btn-join:hover { 
        background: #f5f5f5; 
    }

    .btn-delete {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: 1px solid #fee2e2;
        background: transparent;
        color: #ef4444;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        flex-shrink: 0;
        transition: background 0.12s;
    }

    .btn-delete:hover { 
        background: #fef2f2; 
    }

    #room {
        display: flex;
        flex-direction: column;
        max-width: 15em;
        padding: 2em;
    }
</style>