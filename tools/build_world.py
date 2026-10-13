#!/usr/bin/env python3
"""Auto-tile the valley ground with the PixelLab Wang tilesets.

Reads the layout from src/world_layout.js, decides a terrain (snow / path / ice) for every
grid vertex, then picks each 16px cell's tile by its four corner terrains — exactly how
PixelLab's corner-based (Wang) tilesets are meant to be used — and writes
assets/img/world_ground.png.
"""
import json, math, os, random, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS = os.path.join(ROOT, 'tools', 'tilesets')


def load_layout():
    txt = open(os.path.join(ROOT, 'src', 'world_layout.js')).read()
    return json.loads(re.search(r'=\s*(\{.*\});', txt, re.S).group(1))


def load_tileset(name):
    png, meta = os.path.join(TS, name + '.png'), os.path.join(TS, name + '.json')
    if not (os.path.exists(png) and os.path.exists(meta)):
        return None
    sheet = Image.open(png).convert('RGBA')
    tiles = {}
    for t in json.load(open(meta))['tileset_data']['tiles']:
        c, b = t['corners'], t['bounding_box']
        key = (c['NW'], c['NE'], c['SW'], c['SE'])
        img = sheet.crop((b['x'], b['y'], b['x'] + b['width'], b['y'] + b['height']))
        tiles.setdefault(key, []).append(img)
    return tiles


def bez(p0, c, p1, t):
    u = 1 - t
    return (u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1])


def main():
    L = load_layout()
    cell, W, H = L['cell'], L['W'], L['H']
    cols, rows = W // cell, H // cell
    path_pts = []
    for u, v, c in L['edges']:
        for k in range(161):
            path_pts.append(bez(L['nodes'][u], c, L['nodes'][v], k / 160))
    lake = L['lake']

    def terrain(vx, vy):
        x, y = vx * cell, vy * cell
        if ((x - lake['cx']) / lake['rx']) ** 2 + ((y - lake['cy']) / lake['ry']) ** 2 <= 1:
            return 'ice'
        d = min(math.hypot(px - x, py - y) for px, py in path_pts)
        return 'path' if d < cell * 1.35 else 'snow'

    grid = [[terrain(vx, vy) for vx in range(cols + 1)] for vy in range(rows + 1)]
    snow_path, ice_snow = load_tileset('snow_path_pro'), load_tileset('ice_snow_pro')
    rnd = random.Random(3)
    out = Image.new('RGBA', (cols * cell, rows * cell))
    for cy in range(rows):
        for cx in range(cols):
            corners = [grid[cy][cx], grid[cy][cx + 1], grid[cy + 1][cx], grid[cy + 1][cx + 1]]
            kinds = set(corners)
            if 'ice' in kinds and ice_snow:
                # ice tileset: lower = ice, upper = snow (paths never reach the ice)
                key = tuple('lower' if k == 'ice' else 'upper' for k in corners)
                tile = rnd.choice(ice_snow[key])
            else:
                # snow/path tileset: lower = snow, upper = path
                key = tuple('upper' if k == 'path' else 'lower' for k in corners)
                tile = rnd.choice(snow_path[key])
            out.paste(tile, (cx * cell, cy * cell))
    # break up the tile repetition: soft drifts and scattered sparkle, only on plain snow
    px = out.load()
    snowish = lambda p: p[0] > 200 and p[1] > 200 and p[2] > 205
    for _ in range(420):
        x0, y0, w = rnd.randrange(cols * cell), rnd.randrange(rows * cell), rnd.randrange(8, 34)
        shade = rnd.choice([(-12, -10, -4), (8, 8, 6)])
        for dy in range(2):
            for x in range(x0 + dy * 2, min(cols * cell, x0 + w - dy * 2)):
                y = y0 + dy
                if y < rows * cell and snowish(px[x, y]):
                    r, g, b, a = px[x, y]
                    px[x, y] = (max(0, min(255, r + shade[0])), max(0, min(255, g + shade[1])), max(0, min(255, b + shade[2])), a)
    for _ in range(9000):
        x, y = rnd.randrange(cols * cell), rnd.randrange(rows * cell)
        if snowish(px[x, y]):
            px[x, y] = rnd.choice([(255, 255, 255, 255), (214, 216, 232, 255), (236, 238, 248, 255)])
    # cracks and frosty patches on the lake ice
    inside = lambda x, y: ((x - lake['cx']) / (lake['rx'] - 18)) ** 2 + ((y - lake['cy']) / (lake['ry'] - 18)) ** 2 <= 1
    for _ in range(14):
        x, y = lake['cx'] + rnd.uniform(-lake['rx'], lake['rx']) * 0.7, lake['cy'] + rnd.uniform(-lake['ry'], lake['ry']) * 0.7
        ang = rnd.uniform(0, 6.283)
        for _ in range(rnd.randrange(20, 60)):
            ang += rnd.uniform(-0.5, 0.5)
            x += math.cos(ang); y += math.sin(ang)
            if not inside(x, y):
                break
            px[int(x), int(y)] = (226, 240, 252, 255)
            if rnd.random() < 0.3:
                px[int(x) + 1, int(y)] = (180, 210, 238, 255)
    for _ in range(26):
        x0, y0 = lake['cx'] + rnd.uniform(-lake['rx'], lake['rx']) * 0.75, lake['cy'] + rnd.uniform(-lake['ry'], lake['ry']) * 0.75
        for k in range(rnd.randrange(6, 18)):
            x, y = int(x0 + rnd.gauss(0, 5)), int(y0 + rnd.gauss(0, 2))
            if inside(x, y):
                px[x, y] = (236, 244, 252, 255)
    dst = os.path.join(ROOT, 'assets', 'img', 'world_ground.png')
    out.save(dst)
    print('wrote', dst, out.size)


if __name__ == '__main__':
    main()
