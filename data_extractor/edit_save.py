import json
import os
import sys
import uuid
from types import UnionType
from typing import Any


# Script to edit deck and souvenirs of an ongoing run in the Zoominoes save file.
# NB! This has only been tested in some specific situations. This may corrupt your save file in unexpected ways. Always make backups.

RARITY_SPECIAL = 0
RARITY_GEM = 5
RARITY_DELETED = 6

COLORS = {
    'red': 0,
	'blue': 1,
	'green': 2,
	'yellow': 3,
	'rainbow': 4,
	'black': 5,
}

CACHE_FILE = os.path.join(os.path.dirname(__file__), 'edit_save.cache')

GAME_ROOT_DIR = 'C:/Program Files (x86)/Steam/steamapps/common/Zoominos'
GAME_LEVEL_FILE = os.path.join(GAME_ROOT_DIR, 'Zoominoes_Data/level1')
GAME_RESOURCES_FILE = os.path.join(GAME_ROOT_DIR, 'Zoominoes_Data/resources.assets')

class Reader:
    def __init__(self, data: str):
        self.reader = enumerate(data)
        self.i, self.char = next(self.reader, (None, None))

    def has_next(self):
        return self.char is not None

    def peek(self):
        if self.char is None:
            raise ValueError("Unexpected end of data") 
        return self.char

    def peek_index(self):
        if self.i is None:
            raise ValueError("Unexpected end of data") 
        return self.i

    def next(self):
        self.i, self.char = next(self.reader, (None, None))

def find_segment(data: str, key: list[str]) -> tuple[int, int]:
    if '\\' in data:
        raise ValueError("Escape sequences in JSON not supported")

    key_path = [None] + key
    
    boundaries = []

    last_token = None
    path = []

    reader = Reader(data)
    while reader.has_next():
        char = reader.peek()
        if char.isspace() or char == ':':
            reader.next()
        elif char == ',':
            last_token = None
            reader.next()
        elif char == '{' or char == '[':
            path.append(last_token)
            last_token = None

            if path == key_path:
                boundaries.append(reader.peek_index())
            
            reader.next()
        elif char == '}' or char == ']':
            reader.next()

            if path == key_path:
                boundaries.append(reader.peek_index())
            
            path.pop()
            last_token = None
        else:
            is_match = last_token is not None and path + [last_token] == key_path

            if is_match:
                boundaries.append(reader.peek_index())

            last_token = ''
            if char == '"':
                # Read quoted token
                reader.next()
                while True:
                    char = reader.peek()
                    if char == '"':
                        break
                    last_token += char
                    reader.next()
                reader.next()
            else:
                # Read unquoted token
                while True:
                    char = reader.peek()
                    if char.isspace() or char in ',:{[}]"':
                        break
                    last_token += char
                    reader.next()

            if is_match:
                boundaries.append(reader.peek_index())

    if len(path) != 0:
        raise ValueError("Malformed JSON")
    if len(boundaries) != 2:
        print(len(boundaries))
        raise ValueError(f"JSON key not found: {'.'.join(key)}")
    return boundaries[0], boundaries[1]

def parse_segment(data: str, key: list[str]):
    start, end = find_segment(data, key)
    return json.loads(data[start:end])

def replace_segment(data: str, key: list[str], replacement: Any):
    start, end = find_segment(data, key)
    return data[:start] + json.dumps(replacement, indent='\t') + data[end:]

def validate(object: dict[str, Any], key: str, expected_type: type | UnionType):
    if key not in object:
        print(f"ERROR: Missing required key '{key}'")
        sys.exit(1)
    if not isinstance(object[key], expected_type):
        print(f"ERROR: Incorrect type for key '{key}', expected {expected_type}, got {type(object[key])}")
        sys.exit(1)


if len(sys.argv[1:]) != 2:
    print(f"ERROR: Expected 2 arguments, got {len(sys.argv[1:])}")
    print(f"Usage: python {sys.argv[0]} SaveFile.es3 edits.json")
    sys.exit(1)

save_file, edits_file = sys.argv[1:]

with open(save_file, mode='r', encoding='utf8') as f:
    save_raw = f.read()

with open(edits_file, mode='r', encoding='utf8') as f:
    edits: dict[str, Any] = json.load(f)

# Sanity checks

save_format_version = parse_segment(save_raw, ['SaveFormatVersion', 'value'])
if save_format_version != 8:
    print(f"ERROR: Unsupported save format version: {save_format_version}")
    sys.exit(1)
if not parse_segment(save_raw, ['GameState', 'value', 'IsSeededRun']):
    print("ERROR: Cannot edit non-seeded run")
    sys.exit(1)
if len(parse_segment(save_raw, ['GameState', 'value', 'PlayHistory'])) != 0:
    print("ERROR: Cannot edit save with animals in play")
    sys.exit(1)

hand_size = parse_segment(save_raw, ['GameState', 'value', 'HandSize'])

edits_deck = edits.pop('deck', None)
edits_souvenirs = edits.pop('souvenirs', None)

for key in edits:
    print(f"ERROR: Unexpected key '{key}'")
    sys.exit(1)

# Load name to ref mappings

if not os.path.exists(CACHE_FILE):
    print("Generating cache file with entity data")

    from UnityPy import Environment
    from UnityPy.classes import TextAsset
    from UnityPy.enums import ClassIDType
    from UnityPy.helpers.TypeTreeGenerator import TypeTreeGenerator

    env_level = Environment(GAME_LEVEL_FILE)
    env_resources = Environment(GAME_RESOURCES_FILE)
    unity_version = env_level.objects[0].assets_file.unity_version

    generator = TypeTreeGenerator(unity_version)
    generator.load_local_game(GAME_ROOT_DIR)
    env_level.typetree_generator = generator

    translations = None

    for obj in env_resources.objects:
        if obj.type != ClassIDType.TextAsset or obj.peek_name() != "en_US":
            continue

        text_asset: TextAsset = obj.parse_as_object()
        translations_parsed = json.loads(text_asset.m_Script)
        translations = {entry['k']: entry['v'] for entry in translations_parsed['list']}

        break

    assert translations is not None

    name_to_ref: dict[str, str] = {}
    name_to_ptr = {}

    for obj in env_level.objects:    
        if obj.type != ClassIDType.MonoBehaviour:
            continue

        entity_data = obj.parse_as_object(check_read=False)
        entity_type = entity_data.get_type()

        if entity_type != 'ES3ReferenceMgr':
            continue

        for key, value_ptr in zip(entity_data.idRef._Keys, entity_data.idRef._Values):
            value_obj = value_ptr.deref()
            
            if value_obj.type != ClassIDType.MonoBehaviour or not value_obj.peek_name():
                continue

            value_data = value_obj.parse_as_object(check_read=False)

            if value_data.get_type() not in {'TileData', 'TreasureData'}:
                continue
            
            try:
                if value_data.Rarity in {RARITY_DELETED, RARITY_GEM, RARITY_SPECIAL}:
                    continue
                name = value_data.Name
                name = translations[name]
            except (AttributeError, KeyError):
                continue

            # print(value_obj.peek_name(), value_data.Name, value_data.id, value_data.get_type())

            if name in name_to_ref and name_to_ptr[name] != value_ptr:
                raise AssertionError(f"Duplicate name {name}")
            name_to_ref[name] = str(key)
            name_to_ptr[name] = value_ptr

        break

    assert len(name_to_ref) != 0

    with open(CACHE_FILE, mode='w', encoding='utf8') as f:
        json.dump(name_to_ref, f, indent=0)

with open(CACHE_FILE, mode='r', encoding='utf8') as f:
    name_to_ref: dict[str, str] = json.load(f)

if edits_deck is not None:
    deck = [] 

    for animal in edits_deck:
        if animal['name'] not in name_to_ref:
            print(f"ERROR: Unknown animal with name '{animal['name']}'")
            sys.exit(1)

        deck.append({
            'Id' : {
                'value' : str(uuid.uuid4())
            },
            'OuterColor': COLORS[animal['color']],
            'PassiveAllBuffsOnMePerm': False,
            'PassiveSouvenirPointsMult': 1,
            'permanentBonus': 0, # TODO: Is this always 0 in saved data?
            'Scored': False,
            'PlayedByDodo': False,
            'BouncedCount': 0,
            'IsSelfSummon': False,
            'hidden': False,
            'unplayable': False,
            'PlayTargets': {
                'targetingType': 11,
                'priority': 0,
                'count': 0,
                'conditionals': [],
            },
            'data': {
                '__type': 'TileData,Assembly-CSharp',
                '_ES3Ref': name_to_ref[animal['name']],
            },
            'cost': 0,
            'points': animal['points'],
            'AbilityProperties': {},
            'dynamicTextArgs': {},
        })

    save_raw = replace_segment(save_raw, ['GameState', 'value', 'HandTiles'], deck[:hand_size])
    save_raw = replace_segment(save_raw, ['GameState', 'value', 'Deck'], deck[hand_size:])
    save_raw = replace_segment(save_raw, ['GameState', 'value', 'Decklist'], deck)

if edits_souvenirs is not None:
    souvenirs = []

    for souvenir in edits_souvenirs:
        if souvenir['name'] not in name_to_ref:
            print(f"ERROR: Unknown souvenir with name '{souvenir['name']}'")
            sys.exit(1)

        souvenirs.append({
            'data': {
                '__type': 'TreasureData,Assembly-CSharp',
                '_ES3Ref': name_to_ref[souvenir['name']],
            },
            'cost': 1,
            'points': 0,
            'AbilityProperties': {},
            'dynamicTextArgs': {},
        })

    save_raw = replace_segment(save_raw, ['GameState', 'value', 'Treasures'], souvenirs)

with open(save_file, mode='w', encoding='utf8') as f:
    f.write(save_raw)

print(f"Edited save file written to {save_file}")
