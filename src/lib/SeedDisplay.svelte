<script lang="ts">
    import { type Entity, type Level } from "@/game/Entity";
    import { DIFFICULTIES, EntityPool } from "@/game/EntityPool";
    import { RandomManager } from "@/game/RandomManager";
    import { isShop, rollLevels, rollRewards, rollShop } from "@/game/roll";
    import DayIcon from "@/lib/DayIcon.svelte";
    import EntityIcon from "@/lib/EntityIcon.svelte";

    interface Params {
        seed: string;
        difficulty: string;
    }

    const { seed, difficulty }: Params = $props();

    interface Day {
        level: Level;
        rewards: Entity[];
    }

    const days = $derived.by(() => {
        if (!seed) {
            return [];
        }

        const days: Day[] = [];

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
        
        return days;
    });
</script>

{#each days as day}
    <div class="day">
        <DayIcon level={day.level} />{#each day.rewards as reward}<EntityIcon entity={reward} />{/each}
    </div>
{/each}

<style>
    .day {
        margin: 10px 0;
    }

    .day > :global(div) {
        margin: 0 5px;
    }
</style>
