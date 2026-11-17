"""Shared helpers for build_hero_side.py: load the hero's east side frames, sort pixels into kinds."""
import colorsys
from PIL import Image
from _paths import asset

def frames():
    d = 'hero/walk/'
    st = Image.open(asset(d + 'side_east.png')).convert('RGBA')
    wk = Image.open(asset(d + 'walk_east.png')).convert('RGBA')
    return [st] + [wk.crop((i * 64, 0, i * 64 + 64, 64)) for i in range(6)]

def kind(p):
    """o outline, h hair, s skin, g grey (hoodie, shoes), b blue (jeans, eyes), w white, . clear, ? other"""
    r, g, b, a = p
    if a == 0: return '.'
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    if lum < 28: return 'o'
    if lum > 225 and s < 0.3: return 'w'
    if s < 0.16 or (max(r, g, b) - min(r, g, b)) < 22: return 'g'
    if b > r and b > g: return 'b'
    if 0.0 <= h <= 0.12 or h > 0.95:
        return 's' if lum > 135 else 'h'
    return '?'
