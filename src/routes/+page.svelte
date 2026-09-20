<script lang="ts">
    import { getDataForType } from "@/game/data";
    import { EntityType, type Entity, type Level } from "@/game/Entity";
    import { EntityPool } from "@/game/EntityPool";
    import { RandomManager } from "@/game/RandomManager";
    import { isShop, rollLevels, rollRewards, rollShop } from "@/game/roll";
    import DayIcon from "@/lib/DayIcon.svelte";
    import EntityIcon from "@/lib/EntityIcon.svelte";
    import { getQueryParam, setQueryParam } from "@/lib/storage";

    interface Day {
        level: Level;
        rewards: Entity[];
    }

    let seed = $state(getQueryParam('seed'));
    let days: Day[] = $state([]);

    // TODO: Add input to choose difficulty.
    const difficultyData = getDataForType(EntityType.Difficulty)[0];

    show();

    function show() {        
        setQueryParam('seed', seed);

        days = [];

        if (seed === '') return;

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

    input, button {
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
