<script lang="ts">
    import { goto } from "$app/navigation";
    import { env } from "$env/dynamic/public";
    import { getSession, type User } from "$lib/guards/user";
    import { getErrors } from "$lib/shared";
    import type { Room } from "$lib/types";
    import { onMount } from "svelte";

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

    function gotoRoom() {
        console.log("gotoRoom")
    }

    function deleteRoom() {
        console.log("deleteRoom")
    }

    
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div id="room" role="button" tabindex="0" onclick={gotoRoom}>
	<h3>{room.name}</h3>
    <span>&nearrow;</span>
	<span>active Users: {activeUsersText}</span>
	<span>{room.public}</span>
	{#if room.owner === user?.name}
		<button onclick={() => dialog?.showModal()}>Delete</button>
	{/if}
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