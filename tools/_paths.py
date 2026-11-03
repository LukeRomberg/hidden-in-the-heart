"""Shared paths and helpers for the art tools. Run any tool from anywhere:
    python3 tools/build_hero_layers.py
Outputs go straight into src/data/; previews and scratch PNGs go to tools/out/ (gitignored)."""
import base64, io, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets', 'source')
DATA = os.path.join(ROOT, 'src', 'data')
OUT = os.path.join(ROOT, 'tools', 'out')
os.makedirs(OUT, exist_ok=True)


def asset(name):
    return os.path.join(ASSETS, name)


def out(name):
    return os.path.join(OUT, name)


def data_uri(img):
    b = io.BytesIO()
    img.save(b, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()


def write_data(name, obj, **kw):
    """Write src/data/<name> as JSON and report where it went."""
    path = os.path.join(DATA, name)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, **kw)
        f.write('\n')
    print('wrote', os.path.relpath(path, ROOT), f'({os.path.getsize(path) // 1024} KB)')
