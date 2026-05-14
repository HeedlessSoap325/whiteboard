<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

    import { browser } from '$app/environment'
    import { goto } from '$app/navigation'
    import { page } from '$app/state'
    import { verifySession } from '$lib/guards/user';
    import { onMount } from 'svelte';

    onMount(async () => {
		const isVerified = await verifySession();

		if (browser && !isVerified && !(page.url.pathname === "/login" || page.url.pathname === "/register")) {
			goto("/login");
		} else if (browser && isVerified && (page.url.pathname === "/login" || page.url.pathname === "/register")) {
			goto("/");
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
