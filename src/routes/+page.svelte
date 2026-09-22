<script lang="ts">
    import { DIFFICULTIES, MAX_DIFFICULTY } from "@/game/EntityPool";
    import SeedDisplay from "@/lib/SeedDisplay.svelte";
    import { getQueryParams, setQueryParams } from "@/lib/storage";

    const params = getQueryParams();
    
    let seed = $state(params.get('seed') || '');
    let difficulty = $state(params.get('difficulty') || MAX_DIFFICULTY.id)
    
    let shownSeed = $state('');
    let shownDifficulty = $state('');

    show();

    function show() {
        if (seed === '') {
            setQueryParams();

            shownSeed = '';
            shownDifficulty = '';
        } else {
            setQueryParams(['seed', seed], ['difficulty', difficulty]);

            shownSeed = seed;
            shownDifficulty = difficulty;
        }
    }
</script>

<main>
    <form onsubmit={e => e.preventDefault()}>
        <input type="text" placeholder="Enter seed..." bind:value={seed}>
        <select placeholder="TERE LIST" bind:value={difficulty}>
            {#each DIFFICULTIES as difficulty}
                <option value={difficulty.id}>{difficulty.name}</option>
            {/each}
        </select>
        <button onclick={show}>Show</button>
    </form>

    <div class="container">
        <SeedDisplay seed={shownSeed} difficulty={shownDifficulty}/>
    </div>
</main>

<style>
    main {
        max-width: 800px;
        margin: 0 auto;
    }

    form {
        width: fit-content;
        margin: 0 auto;
    }

    input, button, select {
        font-family: 'Fredoka', sans-serif;
        font-size: 1.5rem;
    }

    .container {
        margin: 40px 0;
    }
</style>
