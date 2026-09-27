<script lang="ts">
    import { getDataForType } from "@/game/data";
    import { EntityType, Rarity } from "@/game/Entity";
    import { DIFFICULTIES, MAX_DIFFICULTY } from "@/game/EntityPool";
    import { Zookeeper, ZOOKEEPERS } from "@/game/roll";
    import { SearchRunner, type Goal } from "@/lib/SearchRunner.svelte";
    import SeedDisplay from "@/lib/SeedDisplay.svelte";
    import { loadValue, onDestroyOrHide, saveValue } from "@/lib/storage";

    const rewardTargets = [
        { label: 'Animals', values: getDataForType(EntityType.Tile).filter(e => e.rarity !== Rarity.Special && e.rarity !== Rarity.Starter) },
        { label: 'Snacks', values: getDataForType(EntityType.Spell).filter(e => e.rarity === Rarity.Common || e.rarity === Rarity.Uncommon) },
    ];
    const shopTargets = [
        { label: 'Snacks', values: getDataForType(EntityType.Spell) },
        { label: 'Gems', values: getDataForType(EntityType.Treasure).filter(e => e.rarity === Rarity.Gem) },
        { label: 'Souvenirs', values: getDataForType(EntityType.Treasure).filter(e => e.rarity !== Rarity.Gem) },
    ];

    const searchRunner = new SearchRunner();
    const running = $derived(searchRunner.isRunning());

    const storedConfig = loadValue('search', { difficulty: MAX_DIFFICULTY.id, zookeeper: Zookeeper.Generic, rewardGoals: [], shopGoals: [] });

    let difficulty = $state(storedConfig.difficulty);
    let zookeeper = $state(storedConfig.zookeeper);

    const rewardGoals: Goal[] = $state(storedConfig.rewardGoals);
    const shopGoals: Goal[] = $state(storedConfig.shopGoals);

    onDestroyOrHide(() => {
        saveValue('search', { difficulty, zookeeper, rewardGoals, shopGoals });
    })

    let output = $state('');

    let shownSeed = $state('');
    let shownDifficulty = $state('');
    let shownZookeeper = $state(Zookeeper.Generic);

    function search() {
        output = '';
        shownSeed = '';
        shownDifficulty = difficulty;
        shownZookeeper = zookeeper;

        const start = performance.now();
        searchRunner.run({ 
            difficulty,
            zookeeper,
            rewardGoals: $state.snapshot(rewardGoals),
            shopGoals: $state.snapshot(shopGoals) 
        }, value => {
            const time = (performance.now() - start) / 1000;
            output = `${value.attempts} attempts in ${time.toFixed(1)} seconds (${value.attempts === 0 ? 0 : (value.attempts / time).toFixed()} attempts per second)`
            if (value.seed) {
                shownSeed = value.seed;
            }
        });
    }

    function cancelSearch() {
        searchRunner.stop();
    }
</script>

<main>
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

    <div class="category">
        <div class="title">Rewards</div>

        {#each rewardGoals as goal, i}
            <div>
                <input class="numberinput" type="number" min="1" bind:value={goal.count}>x
                <select bind:value={goal.target}>
                    {#each rewardTargets as targets}
                        <optgroup label={targets.label}>
                            {#each targets.values as target}
                                <option value={target.id}>{target.name}</option>
                            {/each}
                        </optgroup>
                    {/each}
                </select>
                on days
                <input class="numberinput" type="number" min="1" max="56" bind:value={goal.minDay}>
                to
                <input class="numberinput" type="number" min="1" max="56" bind:value={goal.maxDay}>
                <button onclick={() => rewardGoals.splice(i, 1)}>x</button>
            </div>
        {/each}

        <div><button onclick={() => rewardGoals.push({ target: '', minDay: 1, maxDay: 1, count: 1 })}>Add goal</button></div>
    </div>

    <div class="category">
        <div class="title">Shop</div>

        {#each shopGoals as goal, i}
            <div>
                <input class="numberinput" type="number" min="1" bind:value={goal.count}>x
                <select bind:value={goal.target}>
                    {#each shopTargets as targets}
                        <optgroup label={targets.label}>
                            {#each targets.values as target}
                                <option value={target.id}>{target.name}</option>
                            {/each}
                        </optgroup>
                    {/each}
                </select>
                on days
                <input class="numberinput" type="number" min="1" max="56" bind:value={goal.minDay}>
                to
                <input class="numberinput" type="number" min="1" max="56" bind:value={goal.maxDay}>
                <button onclick={() => shopGoals.splice(i, 1)}>x</button>
            </div>
        {/each}

        <div><button onclick={() => shopGoals.push({ target: '', minDay: 1, maxDay: 1, count: 1 })}>Add goal</button></div>
    </div>

    {#if running}
        <button onclick={cancelSearch}>Cancel</button>
    {:else}
        <button onclick={search}>Search</button>
    {/if}

    <p>{output}</p>

    <div class="container">
        {#if shownSeed}
            <p class="seed">Found seed: {shownSeed}</p>
            <SeedDisplay seed={shownSeed} difficulty={shownDifficulty} zookeeper={shownZookeeper} />
        {/if}
    </div>
</main>

<style>
    main {
        max-width: 800px;
        margin: 0 auto;
    }

    main, input, select, button {
        font-family: 'Fredoka', sans-serif;
        font-size: 1.2rem;
    }

    .seed, .title {
        font-size: 1.5rem;
    }

    .container {
        margin: 40px 0;
    }

    .category {
        margin: 20px 0;
    }

    .category > div {
        margin: 10px 0;
    }

    .numberinput {
        width: 3em;
    }
</style>
