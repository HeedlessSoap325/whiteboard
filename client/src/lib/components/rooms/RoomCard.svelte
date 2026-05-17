<script lang="ts">
    import { goto } from "$app/navigation";
    import { env } from "$env/dynamic/public";
    import { getSession, type User } from "$lib/guards/user";
    import { getErrors } from "$lib/shared";
    import type { Room } from "$lib/types";
    import { onMount } from "svelte";
    import Icon from "@iconify/svelte";

	const { room }: {room: Room} = $props();

    const activeUsersText = $derived(`${room.numActiveUsers} / ` + (room.public ? "∞" : room.allowedParticipants.length));
    let user = $state<User | null>(null);
    let dialog: HTMLDialogElement | undefined = $state();
    let isLoading = $state(false);
    let errorMessage = $state("");

    async function confirmDelete() {
        isLoading = true;
        errorMessage = "";

        try {
            const response = await fetch(`http://${env.PUBLIC_SERVER_BASE}:${env.PUBLIC_SERVER_PORT}/rooms/${room.name}`, {
                method: "DELETE",
				credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                errorMessage = getErrors(data) ?? "Delete failed";
                return;
            } else {
                dialog?.close();
            }
        } catch (err) {
			console.error(err);
            errorMessage = "Network error, please try again.";
        } finally {
            isLoading = false;
        }        
    }

    onMount(async () => {
        user = await getSession();
    })

    async function gotoRoom() {
        await goto(`/room/${room.name}`);
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div id="room" class="room-card" role="button" tabindex="0" /*onclick={gotoRoom}*/ onkeydown={(e) => e.key === 'Enter' && gotoRoom()}>
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
            <button class="btn-delete" aria-label="Delete room" onclick={() => dialog?.showModal()}>
                <Icon icon="tabler:trash" aria-hidden="true"/>
            </button>
        {/if}
    </div>
</div>

<dialog id="deleteModal" bind:this={dialog} onclose={() => dialog?.close()} onclick={(e) => { if (e.target === dialog) dialog.close(); }}>
	<div id="content">
        <span class="text">Are you sure you want to delete "{room.name}" ?</span>
        <span class="text">This action is irreversible!</span>
        <div id="buttons">
            <button class="cancel" onclick={() => dialog?.close()}>Cancel</button>
            <button class="delete" onclick={confirmDelete}>{isLoading ? "Deleting..." : "Delete"}</button>
        </div>
        {#if errorMessage}
            <div id="errors">
                {@html errorMessage}
            </div>
        {/if}
	</div>
</dialog>

<style>
    .room-card {
        background: white;
        border: 1px solid #e8e8e8;
        border-radius: 12px;
        padding: 1.1rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 14px;
        transition: border-color 0.15s, box-shadow 0.15s;
        max-width: 240px;
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

    #deleteModal {
        max-width: 32em;
        border-radius: 0.5em;
        border: none;
        padding: 0;
    }

    #deleteModal::backdrop {
        background: rgba(0, 0, 0, 0.3);
    }

    #content {
        padding: 2em;
        display: flex;
        flex-direction: column;
    }

    #deleteModal .text {
        font-size: medium;
    }

    #deleteModal #buttons {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        margin-top: 2em;
        gap: 2em;
    }

    #deleteModal[open] {
        animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes zoom {
        from {
            transform: scale(0.95);
        }

        to {
            transform: scale(1);
        }
    }

    #deleteModal[open]::backdrop {
        animation: fade 0.2s ease-out;
    }

    @keyframes fade {
        from {
            opacity: 0;
        }

        to {
            opacity: 1;
        }
    }

    #deleteModal #buttons button {
        padding: 0.5em 1em;
        font-size: medium;
        outline: none;
        border-radius: 5px;
        cursor: pointer;
        transition: transform 0.2s ease-in-out;
    }

    #deleteModal #buttons button:hover {
        transform: scale(1.05);
        transition: transform 0.2s ease-in-out;
    }

    #deleteModal .delete {
        border: none;
        background-color: #da2d21;
    }

    #deleteModal .cancel {
        border: 1px solid #dee0e4;
        background-color: white;
    }

    #deleteModal #errors {
        margin-top: 0.5em;
        font-size: smaller;
        color: red;
        font-style: italic;
    }
</style>