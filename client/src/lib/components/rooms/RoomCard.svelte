<script lang="ts">
    import { getSession, type User } from "$lib/guards/user";
    import type { Room } from "$lib/types";
    import { onMount } from "svelte";

	const { room }: {room: Room} = $props();

	/*
	async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();

        isLoading = true;
        errorMessage = "";

        try {
            const response = await fetch(`http://${env.PUBLIC_SERVER_BASE}:${env.PUBLIC_SERVER_PORT}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
				credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                errorMessage = getErrors(data) ?? "Login failed";
                return;
            } else {
				await goto("/");
			}

        } catch (err) {
			console.log(err)
            errorMessage = "Network error, please try again.";
        } finally {
            isLoading = false;
        }
    }
	*/

    const activeUsersText = $derived(`${room.numActiveUsers} / ` + (room.public ? "∞" : room.allowedParticipants.length));
    let user = $state<User | null>(null);

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
		<button onclick={deleteRoom}>Delete</button>
	{/if}
</div>