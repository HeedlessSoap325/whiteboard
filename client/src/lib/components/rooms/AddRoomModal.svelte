<script lang="ts">
    import { env } from "$env/dynamic/public";
    import { getErrors } from "$lib/shared";
    import Icon from "@iconify/svelte";
    import { Hint, minLength, pattern, required, useForm, validators } from "svelte-use-form";

	let {showModal = $bindable(), refreshRooms} = $props();

	let dialog: HTMLDialogElement | undefined = $state();
	let form = useForm();
	let name = $state("");
	let participantName = $state("");
	let isPublic = $state(false);
	let allowedParticipants: string[] = $state([]);

    let isLoading = $state(false);
    let errorMessage = $state("");

	function addParticipant() {
		if (participantName === "") return;
		if (allowedParticipants.includes(participantName)) {
			participantName = "";
			return;
		} 

		allowedParticipants.push(participantName);
		participantName = "";
	}

	function removeParticipant(participant: string) {
		allowedParticipants = allowedParticipants.filter((p) => p !== participant)
	}

	$effect(() => {
		if (showModal) dialog?.showModal();
	})

    async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

        isLoading = true;
        errorMessage = "";

        try {

			if (isPublic) {
				allowedParticipants.push("*");
			}

            const response = await fetch(`http://${env.PUBLIC_SERVER_BASE}:${env.PUBLIC_SERVER_PORT}/room/`, {
                method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({name, allowedParticipants}),
				credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                errorMessage = getErrors(data) ?? "Add failed";
                return;
            } else {
                dialog?.close();
				refreshRooms();
            }
        } catch (err) {
			console.error(err);
            errorMessage = "Network error, please try again.";
        } finally {
            isLoading = false;
        }        
    }
</script>

<dialog id="addModal" bind:this={dialog} onclose={() => showModal = false} onclick={(e) => { if (e.target === dialog) dialog.close() }} popover>
	<div id="content">
		<div class="modal-header">
			<h3>Create a room</h3>
		</div>
	
		<form id="form" use:form onsubmit={handleSubmit}>
			<div class="field">
				<label for="name">Room name</label>
				<input id="name" class="input" placeholder="e.g. cool-room" type="text" name="name" bind:value={name} use:validators={[required, minLength(1), pattern(/^[A-Za-z0-9_-]+$/)]} />
				<span class="hint">Letters, numbers, <code>-</code> and <code>_</code> only</span>
				{#if !$form.name?.valid && $form.name?.touched}
					<div class="validation-errors">
						<Hint for="name" on="required">This field is required</Hint>
						<Hint for="name" on="minLength">Must be at least 1 character</Hint>
						<Hint for="name" on="pattern">Only letters, numbers, - and _ allowed</Hint>
					</div>
				{/if}
			</div>
	
			<div class="field toggle-field">
				<div class="toggle-label">
					<span>Public room</span>
					<small>Anyone can join</small>
				</div>
				<label class="toggle" aria-label="Public room">
					<input name="isPublic" type="checkbox" bind:checked={isPublic} />
					<span class="thumb"></span>
				</label>
			</div>
	
			{#if !isPublic}
				<div class="field">
					<label for="participantName">Add participants</label>
					<div class="participant-row">
					<input id="participantName" class="input" placeholder="Username" type="text" name="participantName" bind:value={participantName} />
					<button type="button" class="btn-add-p" onclick={addParticipant} aria-label="Add participant">
						<Icon icon="tabler:user-plus" />
					</button>
					</div>
					{#if allowedParticipants.length > 0}
					<div class="chips">
						{#each allowedParticipants as participant}
						<span class="chip">
							{participant}
							<button type="button" onclick={() => removeParticipant(participant)} aria-label="Remove {participant}">×</button>
						</span>
						{/each}
					</div>
					{/if}
				</div>
			{/if}
	
			<div id="buttons">
				<button type="button" class="cancel" onclick={() => dialog?.close()}>Cancel</button>
				<button class="add" type="submit">
					{#if isLoading}
						<Icon icon="tabler:loader-2" class="spin" aria-hidden="true" />
						Creating...
					{:else}
						<Icon icon="tabler:plus" aria-hidden="true" />
						Create room
					{/if}
				</button>
			</div>
	
			{#if errorMessage}
				<div id="errors">
					<Icon icon="tabler:alert-circle" aria-hidden="true" />
					{@html errorMessage}
				</div>
			{/if}
		</form>
	</div>
</dialog>

<style>
	#addModal {
		max-width: 380px;
		border-radius: 12px;
		border: 1px solid #e8e8e8;
		padding: 0;
		box-shadow: 0 8px 32px rgba(0,0,0,0.10);
	}

	#addModal::backdrop {
		background: rgba(0,0,0,0.35);
		backdrop-filter: blur(2px);
	}

	#content {
		padding: 1.75rem;
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}
	
	.modal-header {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	
	#addModal h3 {
		font-size: 16px; font-weight: 600;
		color: #111; margin: 0;
	}
  
	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 1.5em;
	}

	.field label {
	  	font-size: 13px; 
		font-weight: 500; 
		color: #4b5563;
	}

	.input {
		padding: 8px 12px;
		font-size: 13px;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background: #fff;
		color: #111;
		outline: none;
		transition: border-color 0.12s, box-shadow 0.12s;
	}

	.input:focus {
		border-color: #93c5fd;
		box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
	}

	.hint {
	  	font-size: 11px; 
		color: #9ca3af;
	}

	.hint code {
		font-family: monospace;
		background: #f3f4f6;
		padding: 1px 4px;
		border-radius: 4px;
	}

	.validation-errors {
		font-size: 12px; 
		color: #ef4444;
		display: flex; 
		flex-direction: column; 
		gap: 2px;
	}
  
	.toggle-field {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		background: #f9fafb;
		border: 1px solid #f0f0f0;
		border-radius: 8px;
		padding: 10px 12px;
	}

	.toggle-label span {
	  	font-size: 13px; 
		font-weight: 500; 
		color: #111; 
		display: block;
	}

	.toggle-label small {
	  	font-size: 11px; 
		color: #9ca3af;
	}

	.toggle { 
		position: relative; 
		cursor: pointer; 
	}

	.toggle input { 
		opacity: 0; 
		width: 0; 
		height: 0; 
		position: absolute; 
	}

	.thumb {
		display: block; width: 36px; height: 20px;
		background: #d1d5db;
		border-radius: 99px;
		transition: background 0.15s;
		position: relative;
	}

	.thumb::after {
		content: '';
		position: absolute; top: 3px; left: 3px;
		width: 14px; height: 14px;
		border-radius: 50%; background: white;
		transition: transform 0.15s;
		box-shadow: 0 1px 3px rgba(0,0,0,0.15);
	}

	.toggle input:checked ~ .thumb { 
		background: #2563eb; 
	}
	.toggle input:checked ~ .thumb::after { 
		transform: translateX(16px); 
	}
  
	.participant-row { 
		display: flex; 
		gap: 6px; 
	}

	.participant-row .input { 
		flex: 1; 
	}

	.btn-add-p {
		width: 36px; height: 36px; flex-shrink: 0;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
		background: transparent; color: #6b7280;
		cursor: pointer; font-size: 16px;
		display: flex; align-items: center; justify-content: center;
		transition: background 0.12s;
	}

	.btn-add-p:hover {
		background: #f5f5f5; 
	}

	.chips {
	  	display: flex; flex-wrap: wrap; gap: 6px;
	}

	.chip {
		display: inline-flex; align-items: center; gap: 4px;
		padding: 3px 8px;
		background: #f3f4f6;
		border: 1px solid #e5e7eb;
		border-radius: 99px;
		font-size: 12px; color: #374151;
	}

	.chip button {
		background: none; border: none; cursor: pointer;
		color: #9ca3af; font-size: 14px; padding: 0; line-height: 1;
	}

	.chip button:hover { 
		color: #ef4444; 
	}
  
	#buttons {
		display: flex; gap: 8px;
		border-top: 1px solid #f0f0f0;
		padding-top: 1rem; margin-top: 2px;
	}

	#addModal #buttons button {
		flex: 1; padding: 8px 16px;
		font-size: 13px; font-weight: 500;
		border-radius: 8px; cursor: pointer;
		display: flex; align-items: center; justify-content: center; gap: 5px;
		transition: background 0.12s, filter 0.12s;
	}
	#addModal .cancel {
		border: 1px solid #e0e0e0;
		background: transparent; color: #111;
	}

	#addModal .cancel:hover { 
		background: #f5f5f5; 
	}

	#addModal .add {
		border: none;
		background: #eff6ff; color: #2563eb;
	}

	#addModal .add:hover { 
		filter: brightness(0.93); 
	}
  
	#errors {
		margin-top: 4px; font-size: 12px;
		color: #ef4444;
		display: flex; align-items: center; gap: 4px;
	}
  
	:global(.spin) { 
		animation: spin 0.8s linear infinite; 
	}
	@keyframes spin { 
		to { 
			transform: rotate(360deg); 
		} 
	}
  
	#addModal[open] {
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

	#addModal[open]::backdrop {
		animation: fade 0.2s ease-out; 
	}

	@keyframes fade {
		from { 
			opacity: 0; 
		}
		to   { 
			opacity: 1; 
		}
	}
</style>