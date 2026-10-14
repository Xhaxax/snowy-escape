"""Build the Whispering Pines sketch progression stills.

Each animal's finished pencil sketch (PixelLab, assets/img/sketch_src/<kind>.png, 48x48 transparent)
is drawn onto the blank right-hand page of a close-up notebook still (assets/img/sketch_src/page.png,
PixelLab, a closer view of cut/sketch) in stages: a faint underdrawing of the whole animal
first, then the outlines going in, then the shading, until the last trip finishes it.
Writes assets/img/cut/sketch_<kind>_<n>.png for n = 1..trips. The page's handwriting (the name and
a few field notes, more of them each stage) is added afterwards in the browser, in the game's font:
tools/sketch_notes.cjs.

    python3 tools/build_sketch_stages.py
"""
import random
from PIL import Image

TRIPS = {'fox': 4, 'hare': 3, 'deer': 4, 'elk': 5, 'bird': 3, 'owl': 6, 'bear': 7}
ROOT = 'assets/img'
CX, BOTTOM, MAXW, MAXH = 150, 106, 58, 56   # the middle of the right-hand page (it may run under the hand)
TILT = 0.25                                  # the page leans: each row shifts with it
GRAPHITE = (78, 70, 66)


def lum(c):
    return 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]


def stage(page, art, f, rnd):
    """page with the drawing at fraction f (0..1] of the way to finished"""
    art = art.crop(art.getbbox())
    sc = min(1.0, MAXW / art.width, MAXH / art.height)
    if sc < 1:
        art = art.resize((max(1, round(art.width * sc)), max(1, round(art.height * sc))), Image.NEAREST)
    a = art.load()
    w, h = art.size
    out = page.copy()
    o = out.load()
    x0, y0, x1, y1 = 0, 0, w, h
    ox, oy = round(CX - w / 2), BOTTOM - h
    def stroke(x, y):
        c = a[x, y]
        return c[3] > 40 and lum(c) < 226
    order = {}
    for y in range(y0, y1):
        for x in range(x0, x1):
            if not stroke(x, y):
                continue
            # lone specks of the ground hatching read as dirt on the page: leave them out
            if sum(stroke(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy) and 0 <= x + dx < w and 0 <= y + dy < h) < 2:
                continue
            edge = any(not (0 <= x + dx < w and 0 <= y + dy < h) or not stroke(x + dx, y + dy) or lum(a[x + dx, y + dy]) > 226
                       for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))) or lum(a[x, y]) < 100
            s = 0.6 * (y - y0) / max(1, y1 - y0) + 0.4 * (x - x0) / max(1, x1 - x0) + rnd.uniform(-0.08, 0.08)
            order[(x, y)] = (edge, s)
    for (x, y), (edge, s) in order.items():
        c = a[x, y]
        dark = 1 - lum(c) / 255
        if f >= 1:
            k = 1.0
        elif edge:
            k = 1.0 if s < f * 1.45 else 0.3       # outlines go in; the rest is the faint underdrawing
        else:
            k = 1.0 if s < (f - 0.3) * 1.75 else 0.0  # shading comes later
        if k <= 0:
            continue
        alpha = min(1.0, 0.25 + dark * 1.1) * k
        # into page space: scaled, sheared with the tilt of the page
        X, Y = ox + x, oy + y
        X += round((Y - 78) * TILT)
        if not (0 <= X < out.width and 0 <= Y < out.height):
            continue
        base = o[X, Y]
        if lum(base) < 170 or base[0] - base[2] > 70:  # not paper (the glove, the pencil, the fold): it is in front
            continue
        ink = tuple(int(GRAPHITE[i] * (0.55 + 0.45 * (1 - dark)) ) for i in range(3))
        o[X, Y] = tuple(int(base[i] * (1 - alpha) + ink[i] * alpha) for i in range(3)) + (255,)
    return out


def main():
    page = Image.open(f'{ROOT}/sketch_src/page.png').convert('RGBA')
    for kind, n in TRIPS.items():
        art = Image.open(f'{ROOT}/sketch_src/{kind}.png').convert('RGBA')
        for k in range(1, n + 1):
            rnd = random.Random(kind)  # the same stroke order every stage
            stage(page, art, k / n, rnd).save(f'{ROOT}/cut/sketch_{kind}_{k}.png')
        print(kind, n)


if __name__ == '__main__':
    main()
