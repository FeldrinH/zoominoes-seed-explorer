<script lang="ts">
    import { EntityPool } from "./game/EntityPool";
    import { getRandomSeed, RandomManager } from "./game/RandomManager";
    import { isShop, rollRewards, rollShop } from "./game/RollManager";
    import { TaskContext } from "./lib/task";

    const taskContext = new TaskContext();

    function compute() {
        taskContext.run(doCompute(), v => output = v);
    }

    async function* doCompute() {
        let output = [''];
        yield output;

        const entityPool = new EntityPool();
        for (let k = 0;; k++) {
            const seed = getRandomSeed(8);
            const randomManager = new RandomManager(seed);
        
            const rewardTargets = ['Tanuki', 'Moth', 'Kangaroo'];
            const shopTargets = ['Super Ghost Pepper'];
            const shopTargetCounts = [2];

            const allRewards = [];
            for (let level = 0; level < 15; level++) {
                if (isShop(level)) {
                    const items = rollShop(entityPool, randomManager, level, false);
                    allRewards.push(items);
                    for (let i = 0; i < shopTargets.length; i++) {
                        if (shopTargetCounts[i] === 0) continue;
                        if (items.some(r => r.data.name === shopTargets[i])) {
                            shopTargetCounts[i] -= 1;
                        }
                    }
                } else {
                    const rewards = rollRewards(entityPool, randomManager, level);
                    allRewards.push(rewards);
                    for (let i = 0; i < rewardTargets.length; i++) {
                        if (rewards.some(r => r.data.name === rewardTargets[i])) {
                            rewardTargets.splice(i, 1);
                            break;
                        }
                    }
                }
            }
            
            if (k % 50000 === 0) {
                output[0] = `${k} attempts`;
                yield output;
            }
            if (rewardTargets.length === 0 && shopTargetCounts.every(v => v === 0)) {
                output = [`${k} attempts`, `Seed ${seed}`];
                for (const rewards of allRewards) {
                    output.push(rewards.map(r => r.data.name).join(" | "));
                }
                yield output;
                return;
            }
        }
    }

    let seed = $state("");
    let output: string[] = $state([]);
</script>

<input type="text" bind:value={seed}>
<button onclick={compute}>Compute</button>

{#each output as line}
    <p>{line}</p>
{/each}

<style>
    :global(html, body) {
        margin: 0;
    }

    p {
        margin-bottom: 2px;
    }
</style>
