import { getDataForType } from "./data";
import { EntityType, Rarity, RARITY_VALUES, type DifficultyData, type Entity, type EntityData, type Tile, type TileData } from "./Entity";
import { RandomGroup, type RandomManager } from "./RandomManager";

// We use name as ID for aesthetic reasons. The ID shows up in query parameters.
export const DIFFICULTIES: DifficultyData[] = getDataForType(EntityType.Difficulty)
    .map(({ id, name, ...rest }) => ({ id: name.toLowerCase(), name, ...rest }));

export const MIN_DIFFICULTY: DifficultyData = DIFFICULTIES[0];
export const MAX_DIFFICULTY: DifficultyData = DIFFICULTIES[DIFFICULTIES.length - 1];

// Based on EntityPool from decompiled Zoominoes source code

const oddsByTypeAndRarityAndLevel = new Map([
    [
        EntityType.Tile,
        new Map([
            [
                Rarity.Common,
                [
                    100, 90, 80, 70, 60, 50, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0
                ]
            ],
            [
                Rarity.Uncommon,
                [
                    0, 10, 17, 26, 34, 42, 90, 85, 80, 75,
                    70, 60, 50, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0
                ]
            ],
            [
                Rarity.Rare,
                [
                    0, 0, 3, 4, 5, 6, 7, 10, 13, 16,
                    19, 27, 35, 80, 80, 80, 80, 80, 80, 80,
                    60, 60, 60, 60, 60, 60, 60, 60
                ]
            ],
            [
                Rarity.Mythical,
                [
                    0, 0, 0, 0, 1, 2, 3, 5, 7, 9,
                    11, 13, 15, 20, 20, 20, 20, 20, 20, 20,
                    40, 40, 40, 40, 40, 40, 40, 40
                ]
            ]
        ])
    ],
    [
        EntityType.Treasure,
        new Map([
            [
                Rarity.Common,
                [
                    70, 70, 70, 70, 70, 70, 70, 70, 70, 58,
                    58, 58, 50, 50, 50, 50, 40, 40, 40, 30,
                    30, 30, 30, 15, 15, 15, 0, 0
                ]
            ],
            [
                Rarity.Uncommon,
                [
                    30, 30, 30, 30, 30, 25, 25, 25, 25, 25,
                    25, 25, 27, 27, 27, 27, 30, 30, 30, 33,
                    33, 33, 33, 25, 25, 25, 10, 10
                ]
            ],
            [
                Rarity.Rare,
                [
                    0, 0, 0, 0, 0, 4, 4, 4, 4, 15,
                    15, 15, 20, 20, 20, 20, 25, 25, 25, 30,
                    30, 30, 30, 50, 50, 50, 80, 80
                ]
            ],
            [
                Rarity.Mythical,
                [
                    0, 0, 0, 0, 0, 1, 1, 1, 1, 2,
                    2, 2, 3, 3, 3, 3, 5, 5, 5, 7,
                    7, 7, 7, 10, 10, 10, 10, 10
                ]
            ]
        ])
    ],
    [
        EntityType.Spell,
        new Map([
            [
                Rarity.Common,
                [
                    70, 70, 70, 70, 70, 60, 60, 60, 60, 50,
                    50, 50, 40, 40, 40, 40, 30, 30, 30, 25,
                    25, 25, 25, 25, 25, 25, 25, 25
                ]
            ],
            [
                Rarity.Uncommon,
                [
                    25, 25, 25, 25, 25, 30, 30, 30, 30, 30,
                    30, 30, 33, 33, 33, 33, 30, 30, 30, 25,
                    25, 25, 25, 25, 25, 25, 25, 25
                ]
            ],
            [
                Rarity.Rare,
                [
                    4, 4, 4, 4, 4, 8, 8, 8, 8, 15,
                    15, 15, 20, 20, 20, 20, 25, 25, 25, 25,
                    25, 25, 25, 25, 25, 25, 25, 25
                ]
            ],
            [
                Rarity.Mythical,
                [
                    1, 1, 1, 1, 1, 2, 2, 2, 2, 5,
                    5, 5, 7, 7, 7, 7, 15, 15, 15, 25,
                    25, 25, 25, 25, 25, 25, 25, 25
                ]
            ]
        ])
    ]
]);

export class EntityPool {
	dataByTypeAndRarity: Map<EntityType, Map<Rarity, EntityData[]>>;

	constructor() {
		this.dataByTypeAndRarity = new Map();
		for (const value2 of [EntityType.Tile, EntityType.Treasure, EntityType.Spell, EntityType.Level]) {
			this.dataByTypeAndRarity.set(value2, new Map());
			for (const value3 of RARITY_VALUES) {
				this.dataByTypeAndRarity.get(value2)!.set(value3, []);
			}
			const array = getDataForType(value2);
			for (const entityData of array) {
				this.dataByTypeAndRarity.get(value2)!.get(entityData.rarity)!.push(entityData);
			}
		}
	}

	getAllEntityData(entityType: EntityType, rarity: Rarity): EntityData[] {
		return this.dataByTypeAndRarity.get(entityType)!.get(rarity)!;
	}

	rollEntityData(entityType: EntityType, rarity: Rarity, rng: RandomManager, rngGroup: RandomGroup, bannedDatas: EntityData[] | null = null): EntityData {
		if (bannedDatas == null) {
			bannedDatas = [];
		}
		const list = this.dataByTypeAndRarity.get(entityType)!.get(rarity)!.slice();
		for (const bannedData of bannedDatas) {
            const index = list.indexOf(bannedData);
            if (index !== -1) {
                list.splice(index, 1);
            }
		}
		if (list.length === 0) {
			rarity++;
			if (rarity === Rarity.Deleted) {
				rarity = Rarity.Common;
			}
			return this.rollEntityData(entityType, rarity, rng, rngGroup, bannedDatas);
		}
        return rng.randomFromList(list, rngGroup);
	}

    rollEntity(entityType: EntityType, rarity: Rarity, rng: RandomManager, rngGroup: RandomGroup, bannedDatas: EntityData[] | null = null): Entity {
		const data = this.rollEntityData(entityType, rarity, rng, rngGroup, bannedDatas);
		if (entityType === EntityType.Tile) {
            // TODO: Because the color is drawn from RandomGroup.Create it is affected by random transforms and other transient events.
            // This makes the color extremely hard to reliably predict, so maybe we should just exclude it from our data model?.
            const color = rng.randomFromList((data as TileData).possibleColors, RandomGroup.Create);
            return { data, color } as Tile
        }
        return { data };
	}

	rollUniquesByRarity(entityType: EntityType, rarity: Rarity, count: number, rng: RandomManager, rngGroup: RandomGroup, bannedDatas: EntityData[] | null = null): Entity[] {
		if (bannedDatas == null) {
			bannedDatas = [];
		}
		const list = [];
		for (let i = 0; i < count; i++) {
			const entity = this.rollEntity(entityType, rarity, rng, rngGroup, bannedDatas);
			list.push(entity);
			if (entity.data.rarity != Rarity.Gem) {
				bannedDatas.push(entity.data);
			}
		}
		return list;
	}

	rollUniquesByLevel(level: number, entityType: EntityType, count: number, rng: RandomManager, rngGroup: RandomGroup, bannedDatas: EntityData[] | null = null): Entity[] {
		if (bannedDatas == null) {
			bannedDatas = [];
		}
		if (entityType == EntityType.Tile) {
			const rarity = this.rollRarity(level, entityType, rng, rngGroup);
			return this.rollUniquesByRarity(entityType, rarity, count, rng, rngGroup, bannedDatas);
		}
		const list = [];
		for (let i = 0; i < count; i++) {
			const rarity2 = this.rollRarity(level, entityType, rng, rngGroup);
			const entity = this.rollEntity(entityType, rarity2, rng, rngGroup, bannedDatas);
			list.push(entity);
			if (entity.data.rarity != Rarity.Gem) {
				bannedDatas.push(entity.data);
			}
		}
		return list;
	}

	rollRarity(level: number, entityType: EntityType, rng: RandomManager, rngGroup: RandomGroup): Rarity {
        level = Math.min(Math.max(level, 0), 27);
		let num = rng.next(0, 100, rngGroup);
		for (const key of oddsByTypeAndRarityAndLevel.get(entityType)!.keys()) {
			const num2 = oddsByTypeAndRarityAndLevel.get(entityType)!.get(key)![level];
			if (num < num2) {
				return key;
			}
			num -= num2;
		}
		console.warn("Error in EntityPool.rollRarity - odds must not sum to 100%");
		return Rarity.Common;
	}
}
