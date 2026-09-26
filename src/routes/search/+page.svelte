<script lang="ts">
    import { getDataForType } from "@/game/data";
    import { EntityType, Rarity } from "@/game/Entity";
    import { DIFFICULTIES, EntityPool, MAX_DIFFICULTY } from "@/game/EntityPool";
    import { getRandomSeed, RandomManager } from "@/game/RandomManager";
    import { isScheduledShop, rollRewards, rollShop } from "@/game/roll";
    import SeedDisplay from "@/lib/SeedDisplay.svelte";
    import { loadValue, onDestroyOrHide, saveValue } from "@/lib/storage";
    import { TaskContext } from "@/lib/TaskContext.svelte";

    interface GoalData {
        target: string;
        minDay: number;
        maxDay: number;
        count: number;
    }

    const rewardTargets = [
        { label: 'Animals', values: getDataForType(EntityType.Tile).filter(e => e.rarity !== Rarity.Special && e.rarity !== Rarity.Starter) },
        { label: 'Snacks', values: getDataForType(EntityType.Spell).filter(e => e.rarity === Rarity.Common || e.rarity === Rarity.Uncommon) },
    ];
    const shopTargets = [
        { label: 'Snacks', values: getDataForType(EntityType.Spell) },
        { label: 'Gems', values: getDataForType(EntityType.Treasure).filter(e => e.rarity === Rarity.Gem) },
        { label: 'Souvenirs', values: getDataForType(EntityType.Treasure).filter(e => e.rarity !== Rarity.Gem) },
    ];

    const taskContext = new TaskContext();
    const running = $derived(taskContext.isRunning());

    const storedConfig = loadValue('search', { difficulty: MAX_DIFFICULTY.id, rewardGoals: [], shopGoals: [] });

    let difficulty = $state(storedConfig.difficulty);

    const rewardGoals: GoalData[] = $state(storedConfig.rewardGoals);
    const shopGoals: GoalData[] = $state(storedConfig.shopGoals);

    onDestroyOrHide(() => {
        saveValue('search', { difficulty, rewardGoals, shopGoals });
    })

    let output: string = $state('');

    let shownSeed: string = $state('');
    let shownDifficulty: string = $state('');

    function search() {
        output = '';
        shownSeed = '';
        shownDifficulty = difficulty;
        taskContext.run(doSearch(), value => {
            const timeSeconds = value.time / 1000;
            output = `${value.attempts} attempts in ${timeSeconds.toFixed(1)} seconds (${value.attempts === 0 ? 0 : (value.attempts / timeSeconds).toFixed()} attempts per second)`
            if (value.seed) {
                shownSeed = value.seed;
            }
        });
    }

    function cancelSearch() {
        taskContext.stop();
    }

    function* doSearch() {
        const start = performance.now();

        const difficultyData = DIFFICULTIES.find(v => v.id === difficulty)!;

        const rewardGoalsRef = $state.snapshot(rewardGoals).filter(g => g.target !== '');
        const shopGoalsRef = $state.snapshot(shopGoals).filter(g => g.target !== '');

        yield { attempts: 0, time: 0 };

        const entityPool = new EntityPool();
        
        for (let attempts = 1;; attempts++) {
            const seed = getRandomSeed(8);
            const randomManager = new RandomManager(seed);
        
            const rewardGoalsCur = rewardGoalsRef.map(g => ({ ...g }));
            const shopGoalsCur = shopGoalsRef.map(g => ({ ...g }));

            outer:
            for (let level = 0; level < difficultyData.levelSchedule.length; level++) {
                if (isScheduledShop(level, difficultyData)) {
                    if (shopGoalsCur.length === 0) continue;
                    const items = rollShop(entityPool, randomManager, level, false);
                    for (let i = shopGoalsCur.length - 1; i >= 0; i--) {
                        const goal = shopGoalsCur[i];
                        if (level + 1 > goal.maxDay) break outer; // Guaranteed failure
                        if (level + 1 >= goal.minDay && items.some(r => r.data.id === goal.target)) {
                            goal.count -= 1;
                            if (goal.count === 0) {
                                shopGoalsCur.splice(i, 1);
                            }
                        }
                    }
                } else {
                    if (rewardGoalsCur.length === 0) continue;
                    const rewards = rollRewards(entityPool, randomManager, level);
                    for (let i = 0; i < rewardGoalsCur.length; i++) {
                        const goal = rewardGoalsCur[i];
                        if (level + 1 > goal.maxDay) break outer; // Guaranteed failure
                        if (level + 1 >= goal.minDay && rewards.some(r => r.data.id === goal.target)) {
                            goal.count -= 1;
                            if (goal.count === 0) {
                                rewardGoalsCur.splice(i, 1);
                            }
                            break;
                        }
                    }
                }
            }

            if (attempts % 100_000 === 0) {
                yield { attempts, time: performance.now() - start };
            }

            if (rewardGoalsCur.length === 0 && shopGoalsCur.length === 0) {
                yield { attempts, time: performance.now() - start, seed };
                return;
            }
        }
    }
</script>

<main>
    <select bind:value={difficulty}>
        {#each DIFFICULTIES as difficulty}
            <option value={difficulty.id}>{difficulty.name}</option>
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
            <SeedDisplay seed={shownSeed} difficulty={shownDifficulty} />
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
