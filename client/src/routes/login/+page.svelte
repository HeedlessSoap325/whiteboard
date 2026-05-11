<script lang="ts">
    import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import { env } from '$env/dynamic/public';
	import { useForm, validators, Hint, required, minLength } from "svelte-use-form";
    import { goto } from '$app/navigation';

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

            const data = await response.text();

            if (!response.ok) {
                errorMessage = data ?? "Login failed";
                return;
            } else {
				errorMessage = "";
				await goto("/");
			}

        } catch (err) {
			console.log(err)
            errorMessage = "Network error, please try again.";
        } finally {
            isLoading = false;
        }
    }
</script>

<main>
	<form use:form onsubmit={handleSubmit}>
		<img src={favicon} alt="favicon"/>
		<h2>Login</h2>
		<input placeholder="Username" type="text" name="username" bind:value={username} use:validators={[required, minLength(1)]}/>
		<Hint for="username" on="required">This is a mandatory field</Hint>
		<Hint for="username" on="minLength">This field must be at least 1 character long</Hint>


		<input placeholder="Pasword" type="password" name="password" bind:value={password} use:validators={[required, minLength(8)]}/>
		<Hint for="password" on="required">This is a mandatory field</Hint>
		<Hint for="password" on="minLength">This field must be at least 8 character long</Hint>

		{#if errorMessage}
        	<p class="error">{errorMessage}</p>
    	{/if}

		<button disabled={!$form.valid || isLoading}>{isLoading ? "Logging in…" : "Login"}</button>
		<span>Don't have an Account yet? Register <a href={resolve("/register")}>here</a>!</span>
	</form>
</main>

<style>

</style>