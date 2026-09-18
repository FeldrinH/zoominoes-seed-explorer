import json
import os

from UnityPy import Environment
from UnityPy.classes import TextAsset, Texture2D, UnknownObject
from UnityPy.enums import ClassIDType
from UnityPy.helpers.TypeTreeGenerator import TypeTreeGenerator

RARITY_DELETED = 6

GAME_ROOT_DIR = 'C:/Program Files (x86)/Steam/steamapps/common/Zoominos'
GAME_ASSETS_FILE = os.path.join(GAME_ROOT_DIR, 'Zoominoes_Data/sharedassets0.assets')
GAME_RESOURCES_FILE = os.path.join(GAME_ROOT_DIR, 'Zoominoes_Data/resources.assets')

print(f"Loading assets from {GAME_ROOT_DIR}")

env_assets = Environment(GAME_ASSETS_FILE)
env_resources = Environment(GAME_RESOURCES_FILE)
unity_version = env_assets.objects[0].assets_file.unity_version

print(f"Detected Unity version {unity_version}")

generator = TypeTreeGenerator(unity_version)
generator.load_local_game(GAME_ROOT_DIR)
env_assets.typetree_generator = generator

sprites_root = os.path.join(os.path.dirname(__file__), '../public/sprites')
data_root = os.path.join(os.path.dirname(__file__), '../src/game/')
os.makedirs(sprites_root, exist_ok=True)
os.makedirs(data_root, exist_ok=True)
for file in os.listdir(sprites_root):
    if file.endswith('.png'):
        os.remove(os.path.join(sprites_root, file))

translations = None

for obj in env_resources.objects:
    if obj.type != ClassIDType.TextAsset or obj.peek_name() != "en_US":
        continue

    text_asset: TextAsset = obj.parse_as_object()
    translations_parsed = json.loads(text_asset.m_Script)
    translations = {entry['k']: entry['v'] for entry in translations_parsed['list']}

    break

assert translations is not None

types = {'TileData': 0, 'TreasureData': 1, 'SpellData': 2, 'LevelData': 4, 'DifficultyData': 6}
data = {k: [] for k in types}

for obj in env_assets.objects:
    file_name = obj.peek_name()

    if obj.type != ClassIDType.MonoBehaviour or not file_name:
        continue

    entity_data = obj.parse_as_object(check_read=False)
    entity_type = entity_data.get_type()

    if entity_type not in data or entity_data.Rarity == RARITY_DELETED:
        continue

    sprite = entity_data.Sprite.deref_parse_as_object().m_RD.texture.deref_parse_as_object()
    sprite.image.save(os.path.join(sprites_root, f'{file_name}.png'))

    entity_dict = {
        'type': types[entity_type],
        'fileName': file_name,
        'id': entity_data.id,
        'name': translations[entity_data.Name] if entity_data.Name else '',
        'rarity': entity_data.Rarity,
    }
    if entity_type == 'TileData':
        entity_dict |= {
            'possibleColors': entity_data.PossibleColors,
            'subtype': entity_data.Subtype
        }
        
    elif entity_type == 'DifficultyData':
        entity_dict |= {
            'levelSchedule': entity_data.LevelSchedule,
        }

    data[entity_type].append(entity_dict)

# Order of data is important. According to some forum posts online, Resources.LoadAll, which the game uses, sorts data alphabetically by file name.
for entity_datas in data.values():
    entity_datas.sort(key=lambda v: v['fileName'])

with open(os.path.join(data_root, 'data.json'), mode='w', encoding='utf8') as f:
    json.dump(data, f)
