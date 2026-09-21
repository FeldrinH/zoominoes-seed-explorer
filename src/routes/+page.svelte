<script lang="ts">
    import { type Entity, type Level } from "@/game/Entity";
    import { DIFFICULTIES, EntityPool, MAX_DIFFICULTY } from "@/game/EntityPool";
    import { RandomManager } from "@/game/RandomManager";
    import { isShop, rollLevels, rollRewards, rollShop } from "@/game/roll";
    import DayIcon from "@/lib/DayIcon.svelte";
    import EntityIcon from "@/lib/EntityIcon.svelte";
    import { getQueryParams, setQueryParams } from "@/lib/storage";

    interface Day {
        level: Level;
        rewards: Entity[];
    }

    const params = getQueryParams();
    
    let seed = $state(params.get('seed') || '');
    let difficulty = $state(params.get('difficulty') || MAX_DIFFICULTY.id)
    
    let days: Day[] = $state([]);

    show();

    function show() {        
        days = [];

        if (seed === '') {
            setQueryParams();
            return;
        }
        setQueryParams(['seed', seed], ['difficulty', difficulty]);

        const difficultyData = DIFFICULTIES.find(v => v.id === difficulty)!;
        const entityPool = new EntityPool();
        const randomManager = new RandomManager(seed);

        const levels = rollLevels(entityPool, randomManager, difficultyData);

        for (let level = 0; level < 28; level++) {
            if (isShop(levels[level])) {
                const rewards = rollShop(entityPool, randomManager, level, false);
                days.push({ level: levels[level], rewards });
            } else {
                const rewards = level == 27 ? [] : rollRewards(entityPool, randomManager, level);
                days.push({ level: levels[level], rewards });
            }
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
        {#each days as day}
            <div class="day">
                <DayIcon level={day.level} />{#each day.rewards as reward}<EntityIcon entity={reward} />{/each}
            </div>
        {/each}
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

    .day {
        margin: 10px 0;
    }

    .day > :global(div), .day > :global(img) {
        margin: 0 5px;
    }
</style>
