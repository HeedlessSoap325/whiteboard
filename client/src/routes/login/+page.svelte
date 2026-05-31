<script lang="ts">
    import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import { env } from '$env/dynamic/public';
	import { useForm, validators, Hint, required, minLength } from "svelte-use-form";
    import { goto } from '$app/navigation';
    import { getErrors } from '$lib/shared';
    import Icon from '@iconify/svelte';

	const form = useForm();
	let username = $state("");
	let password = $state("");
	let errorMessage = $state("");
    let isLoading = $state(false);

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
				await goto(resolve("/"));
			}

        } catch (err) {
			console.log(err)
            errorMessage = "Network error, please try again.";
        } finally {
            isLoading = false;
        }
    }
</script>

<main id="main">
	<form id="form" use:form onsubmit={handleSubmit}>
		<div id="header">
			<img id="favicon" src={favicon} alt="favicon"/>
			<h2 id="title">Login</h2>
		</div>
		<input id="username" class="input" placeholder="Username" type="text" name="username" bind:value={username} use:validators={[required, minLength(1)]}/>
		{#if !$form.username?.valid && $form.username?.touched}
			<div class="hint">
				<Hint for="username" on="required">This is a mandatory field</Hint>
				<Hint for="username" on="minLength">This field must be at least 1 character long</Hint>
			</div>
		{/if}
		

		<input id="password" class="input" placeholder="Pasword" type="password" name="password" bind:value={password} use:validators={[required, minLength(8)]}/>
		{#if !$form.password?.valid && $form.password?.touched}
			<div class="hint">
				<Hint for="password" on="required">This is a mandatory field</Hint>
				<Hint for="password" on="minLength">This field must be at least 8 character long</Hint>
			</div>
		{/if}

		{#if errorMessage}
        	<p id="error">{@html errorMessage}</p>
    	{/if}

		<button id="button" disabled={!$form.valid || isLoading}>
			{#if isLoading}
				<Icon icon="tabler:loader-2" class="spin" aria-hidden="true" />
				Logging in...
			{:else}
				<Icon icon="tabler:login-2" aria-hidden="true" />
				Login
			{/if}
		</button>
		<span id="register">Don't have an Account yet? Register <a class="link" href={resolve("/register")}>here</a>!</span>
	</form>
</main>

<style>
	#main {
		width: 100dvw;
		height: 100dvh;
		display: flex;
		justify-content: center;
		align-items: center;
		background: linear-gradient(azure, rgb(235, 255, 255));
	}

	#form {
		box-shadow: 0 2px 6px rgba(0,0,0,0.2);
		display: flex;
		flex-direction: column;
		background-color: white;
		padding: 2rem;
	}

	#header {
		display: flex;
		flex-direction: row;
		gap: 1rem;
		align-items: center;
		margin-bottom: 1rem;
	}

	#favicon {
		width: 30px;
	}

	#title {
		margin: 0;
	}

	.input {
		border-radius: 0;
		background-color: transparent;
		border-width: 0 0 1px 0;
		padding-left: 0;
		font-size: medium;
		margin-bottom: 1rem;
		padding-bottom: 5px;
		outline: none;
	}

	.input:focus {
		border-color: #0067b8;
	}

	.hint {
		display: flex;
		flex-direction: column;
		border-radius: 5px;
		border: red 2px solid;
		padding: 0.5rem;
		background-color: rgba(255, 0, 0, 0.3);
		margin-bottom: 1.5rem;
	}

	#error {
		color: red;
		font-style: italic;
		margin: 0 0 1.5rem 0;
	}

	#button {
		width: fit-content;
		text-align: left;
		padding: 0.25rem 2rem;
		font-size: medium;
		border-radius: 0;
		border: none;
		outline: none;
		background-color: #008000;
		cursor: pointer;
		align-self: flex-end;
		margin-bottom: 1rem;
		transition: transform 0.2s ease;
		display: flex;
		align-items: center;
		gap: 2px;
	}

	#button:disabled {
		background-color: rgba(0,0,0,0.2);
		color: rgba(0,0,0,0.8);
	}

	#button:hover{
		transform: scale(1.05);
	}

	#button:hover:disabled {
		transform: none;
		cursor: not-allowed;
	}

	#register {
		font-size: smaller;
	}

	.link {
		text-decoration: none;
	}

</style>