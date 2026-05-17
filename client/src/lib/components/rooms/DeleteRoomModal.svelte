<script lang="ts">
    import { env } from "$env/dynamic/public";
    import { getErrors } from "$lib/shared";
    import Icon from "@iconify/svelte";

	let { dialog = $bindable(), room, onClose } = $props();
    let isLoading = $state(false);
    let errorMessage = $state("");

    async function confirmDelete() {
        isLoading = true;
        errorMessage = "";

        try {
            const response = await fetch(`http://${env.PUBLIC_SERVER_BASE}:${env.PUBLIC_SERVER_PORT}/room/${room.name}`, {
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

	$effect(() => {
		if (room) errorMessage = "";
	})
</script>

<dialog id="deleteModal" bind:this={dialog} onclose={onClose} onclick={(e) => { if (e.target === dialog) onClose(); }}>
	<div id="content">
		<h3 class="modal-title">Delete room?</h3>
		<span class="text">You're about to delete <strong>"{room ? room.name : ""}"</strong>.</span>
		<span class="text">This action is permanent and cannot be undone.</span>
        <div id="buttons">
            <button class="cancel" onclick={onClose}>Cancel</button>
            <button class="delete" onclick={confirmDelete}><Icon icon="tabler:trash" aria-hidden="true"/> {isLoading ? "Deleting..." : "Delete"}</button>
        </div>
        {#if errorMessage}
            <div id="errors">
				<Icon icon="tabler:alert-circle" aria-hidden="true"/>
                {@html errorMessage}
            </div>
        {/if}
	</div>
	
</dialog>

<style>
	#deleteModal {
		max-width: 380px;
		border-radius: 12px;
		border: 1px solid #e8e8e8;
		padding: 0;
		box-shadow: 0 8px 32px rgba(0,0,0,0.12);
	}

	#deleteModal::backdrop {
		background: rgba(0, 0, 0, 0.35);
		backdrop-filter: blur(2px);
	}

	#content {
		padding: 1.75rem;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	#deleteModal h3 {
		font-size: 16px;
		font-weight: 600;
		margin: 0;
		color: #111;
	}

	#deleteModal .text {
		font-size: 14px;
		color: #6b7280;
		line-height: 1.6;
	}

	#deleteModal .text:last-of-type {
		color: #9ca3af;
		font-size: 15px;
	}

	#deleteModal #buttons {
		display: flex;
		gap: 8px;
		margin-top: 12px;
	}

	#deleteModal #buttons button {
		flex: 1;
		padding: 8px 16px;
		font-size: 13px;
		font-weight: 500;
		border-radius: 8px;
		cursor: pointer;
		transition: background 0.12s, filter 0.12s;
	}

	#deleteModal .cancel {
		border: 1px solid #e0e0e0;
		background: transparent;
		color: #111;
	}

	#deleteModal .cancel:hover { 
		background: #f5f5f5; 
	}

	#deleteModal .delete {
		border: none;
		background: #fef2f2;
		color: #ef4444;
	}

	#deleteModal .delete:hover { 
		filter: brightness(0.93); 
	}

	#deleteModal #errors {
		margin-top: 4px;
		font-size: 12px;
		color: #ef4444;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	#deleteModal[open] {
		animation: zoom 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@keyframes zoom {
		from { 
			transform: scale(0.95); 
			opacity: 0; 
		}

		to { 
			transform: scale(1);    
			opacity: 1; 
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
</style>