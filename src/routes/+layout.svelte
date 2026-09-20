<script>
	let { children } = $props();
</script>

<nav>
	<a href="/">View</a>
    <!--a href="/search">Search</a-->
    <a href="/about">About</a>
</nav>

{@render children()}

<footer>
    Zoominoes Seed Explorer by FeldrinH | Source code on <a href="todo">GitHub</a>
    <br>
    Zoominoes art and other assets used on this site belong to Starlight Games inc.
</footer>

<style>
    nav {
        width: fit-content;
        margin: 30px auto;
        font-size: 1.5rem;
    }

    nav > a {
        margin: 0 5px;
    }

    footer {
        width: fit-content;
        margin: 30px auto;
        text-align: center;
    }

    @font-face {
        font-display: swap;
        font-family: 'Fredoka';
        font-style: normal;
        font-weight: 400;
        src: url('/fonts/fredoka-latin-regular.woff2') format('woff2');
    }
    :global(html, body) {
        margin: 0;
        font-family: 'Fredoka', sans-serif;
    }
    :global(input, button) {
        font-family: 'Fredoka', sans-serif;
    }
</style>
