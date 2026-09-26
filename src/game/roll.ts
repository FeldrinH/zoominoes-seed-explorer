import { EntityType, Rarity, type DifficultyData, type Entity, type EntityData, type Level } from "./Entity";
import { EntityPool } from "./EntityPool";
import { RandomGroup, type RandomManager } from "./RandomManager";

// NB! Don't change existing values, they are stored in query parameters and browser storage.
export const enum Zookeeper {
    Generic = '',
    Trinket = 'trinket',
}

export const ZOOKEEPERS = [
    { name: 'Generic zookeeper', id: Zookeeper.Generic },
    { name: 'Trinket', id: Zookeeper.Trinket },
]

export function isShop(level: Level): boolean {
    return level.data.rarity === Rarity.Uncommon;
}

export function isScheduledShop(level: number, difficulty: DifficultyData): boolean {
    return difficulty.levelSchedule[level] === Rarity.Uncommon;
}

// Based on GameState.PopulateLevels from decompiled Zoominoes source code.
export function rollLevels(entityPool: EntityPool, randomManager: RandomManager, difficultyData: DifficultyData): Level[] {
    const currentLevels: Level[] = [];
    const list: EntityData[] = [];
    for (let i = 0; i < difficultyData.levelSchedule.length; i++) {
        const rarity = difficultyData.levelSchedule[i];
        const levelData = entityPool.rollEntityData(EntityType.Level, rarity, randomManager, RandomGroup.General, list);
        if (rarity === Rarity.Rare || rarity === Rarity.Mythical) {
            list.push(levelData);
        }
        currentLevels.push({ day: i + 1, data: levelData });
    }
    return currentLevels;
}

// Based on GameController.GetRewards and GoldRewardsView.Claim from decompiled Zoominoes source code.
// Note: Level starts from 0, so day 1 is level 0.
export function rollRewards(entityPool: EntityPool, randomManager: RandomManager, zookeeper: Zookeeper, level: number, addSpell: boolean = true): Entity[] {
    if (zookeeper === Zookeeper.Trinket) {
        // Any souvenirs you have affect trinket rewards. This makes the rewards basically impossible to predict in any useful way,
        // so we just read the random values without predicting anything.
        // We read 1 random value for picking rarity and 3 random values for picking souvenirs.
        for (let i = 0; i < 4; i++) {
            randomManager.next(0, 1, RandomGroup.Rewards);
        }
    }

    const list: Entity[] = [];
    const list2: EntityData[] = [];
    const rarity = entityPool.rollRarity(level, EntityType.Tile, randomManager, RandomGroup.Rewards);
    // TODO: Support color and type incense rewards?
    const num = 3;
    if (num > 0) {
        list.push(...entityPool.rollUniquesByRarity(EntityType.Tile, rarity, num, randomManager, RandomGroup.Rewards, list2));
    }
    if (addSpell) {
        let rarity2 = Rarity.Common;
        if (randomManager.next(0, 100, RandomGroup.Rewards) < 25) {
            rarity2 = Rarity.Uncommon;
        }
        const item = entityPool.rollEntity(EntityType.Spell, rarity2, randomManager, RandomGroup.Rewards);
        list.push(item);
    }
    return list;
}

// Based on Shop.Roll from decompiled Zoominoes source code.
// Note: Level starts from 0, so day 1 is level 0.
export function rollShop(entityPool: EntityPool, randomManager: RandomManager, level: number, reroll: boolean,
        extraItems: boolean = false, extraGems: boolean = false): Entity[] {
    const rngGroup = reroll ? RandomGroup.ShopRoll : RandomGroup.Shop;
    const spellsCount = extraItems ? 5 : 4;
    const gemsCount = extraGems ? 2 : 1;
    const treasuresCount = extraItems ? 4 : 3;

    const list: EntityData[] = [];
    const list2: Entity[] = [];
    const collection = entityPool.rollUniquesByLevel(level, EntityType.Spell, spellsCount, randomManager, rngGroup, list);
    list2.push(...collection);
    const collection2 = entityPool.rollUniquesByRarity(EntityType.Treasure, Rarity.Gem, gemsCount, randomManager, rngGroup, list);
    list2.push(...collection2);
    const collection3 = entityPool.rollUniquesByLevel(level, EntityType.Treasure, treasuresCount, randomManager, rngGroup, list);
    list2.push(...collection3);
    randomManager.emulateShuffleList(list2.length, rngGroup);
    return list2;
}