import { isScheduledShop, rollRewards, rollShop } from "@/game/roll";
import type { SearchParams } from "./SearchRunner.svelte";
import { DIFFICULTIES, EntityPool } from "@/game/EntityPool";
import { getRandomSeed, RandomManager } from "@/game/RandomManager";

function search({ difficulty, zookeeper, rewardGoals, shopGoals }: SearchParams) {
    const difficultyData = DIFFICULTIES.find(v => v.id === difficulty)!;
    const zookeeperData = zookeeper;

    const rewardGoalsRef = rewardGoals.filter(g => g.target !== '');
    const shopGoalsRef = shopGoals.filter(g => g.target !== '');

    const entityPool = new EntityPool();

    for (let attempts = 0;;) {
        attempts += 1;

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
                const rewards = rollRewards(entityPool, randomManager, zookeeperData, level);
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

        if (attempts >= 100_000) {
            postMessage({ attempts });
            attempts = 0;
        }

        if (rewardGoalsCur.length === 0 && shopGoalsCur.length === 0) {
            postMessage({ attempts, seed });
            return;
        }
    }
}

onmessage = event => {
    search(event.data);
}