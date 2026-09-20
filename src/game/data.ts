import data from './data.json'
import { EntityType, type DifficultyData, type EntityData, type TileData } from './Entity';

export function getDataForType(type: EntityType.Tile): TileData[]
export function getDataForType(type: EntityType.Difficulty): DifficultyData[]
export function getDataForType(type: EntityType): EntityData[]
export function getDataForType(type: EntityType): EntityData[] {
    switch (type) {
        case EntityType.Tile:
            return data['TileData'];
        case EntityType.Treasure:
            return data['TreasureData'];
        case EntityType.Spell:
            return data['SpellData'];
        case EntityType.Level:
            return data['LevelData'];
        case EntityType.Difficulty:
            return data['DifficultyData'];
        default:
            return [];
    }
}