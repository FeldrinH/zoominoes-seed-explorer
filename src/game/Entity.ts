export const enum EntityType {
    None = -1,
	Tile = 0, // Animal
	Treasure = 1, // Souvenir
	Spell = 2, // Snack
	Hero = 3, // Zookeeper
	Level = 4, // Special event
	Slot = 5,
	Difficulty = 6,
	Achievement = 7,
	Hidden = 8,
}

export const ENTITY_TYPE_VALUES = [
    EntityType.None, EntityType.Tile, EntityType.Treasure, EntityType.Spell, EntityType.Hero,
    EntityType.Level, EntityType.Slot, EntityType.Difficulty, EntityType.Achievement, EntityType.Hidden,
]

export const enum Rarity {
	Special = 0,
	Common = 1,
	Uncommon = 2,
	Rare = 3,
	Mythical = 4,
	Gem = 5,
	Deleted = 6,
	Starter = 7,
	Challenge = 8,
}

export const RARITY_VALUES = [
    Rarity.Special, Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Mythical,
    Rarity.Gem, Rarity.Deleted, Rarity.Starter, Rarity.Challenge,
];

export const RARITY_NAMES = [
	'Special', 'Common', 'Uncommon', 'Rare', 'Mythical',
	'Gem', 'Deleted', 'Starter', 'Challenge',
]

export const enum OuterColor {
	None = -1,
	Red = 0,
	Blue = 1,
	Green = 2,
	Yellow = 3,
	Rainbow = 4,
	Black = 5,
}

export const enum Subtype {
	None = 0,
	Sky = 1,
	Land = 2,
	Sea = 3,
}

export interface EntityData {
	type: EntityType;
	fileName: string;
	id: string;
    name: string;
    rarity: Rarity;
}

export interface TileData extends EntityData {
	possibleColors: OuterColor[];
	subtype: Subtype;
}

export interface DifficultyData extends EntityData {
	levelSchedule: Rarity[];
}

export interface Entity {
	data: EntityData;
}

export interface Tile extends Entity {
	color: OuterColor;
}

export interface Level {
	day: number; // NB! Day numbers start from 1, unlike the level index expected by roll functions, which starts from 0.
	data: EntityData;
}
