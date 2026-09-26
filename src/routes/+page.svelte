<script lang="ts">
    import { DIFFICULTIES, MAX_DIFFICULTY } from "@/game/EntityPool";
    import { Zookeeper, ZOOKEEPERS } from "@/game/roll";
    import SeedDisplay from "@/lib/SeedDisplay.svelte";
    import { getQueryParams, setQueryParams } from "@/lib/storage";

    const params = getQueryParams();
    
    let seed = $state(params.get('seed') || '');
    let difficulty = $state(params.get('difficulty') || MAX_DIFFICULTY.id)
    let zookeeper = $state(params.get('zookeeper') as Zookeeper || Zookeeper.Generic);
    
    let shownSeed = $state('');
    let shownDifficulty = $state('');
    let shownZookeeper = $state(Zookeeper.Generic);

    show();

    function show() {
        if (seed === '') {
            setQueryParams();

            shownSeed = '';
            shownDifficulty = '';
            shownZookeeper = Zookeeper.Generic;
        } else {
            setQueryParams(['seed', seed], ['difficulty', difficulty], ['zookeeper', zookeeper]);

            shownSeed = seed;
            shownDifficulty = difficulty;
            shownZookeeper = zookeeper;
        }
    }
</script>

<main>
    <form onsubmit={e => e.preventDefault()}>
        <input type="text" placeholder="Enter seed..." bind:value={seed}>
        <select bind:value={difficulty}>
            {#each DIFFICULTIES as difficulty}
                <option value={difficulty.id}>{difficulty.name}</option>
            {/each}
        </select>
        <select bind:value={zookeeper}>
            {#each ZOOKEEPERS as zookeeper}
                <option value={zookeeper.id}>{zookeeper.name}</option>
            {/each}
        </select>
        <button onclick={show}>Show</button>
    </form>

    <div class="container">
        <SeedDisplay seed={shownSeed} difficulty={shownDifficulty} zookeeper={shownZookeeper} />
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
