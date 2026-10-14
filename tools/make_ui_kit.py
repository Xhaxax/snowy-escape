"""Build assets/img/ui/kit.png from the PixelLab UI sheet (create_ui_asset, 512x512).

The sheet is drawn at 4x the game's pixel size, so its wooden START button comes down to a 41x18
button with a nearest-neighbour downscale. Its lettering is painted over with plain wood, and the
result is saved in four states (rows): normal, hover, active (honey-gold) and dim.
Usage: python3 tools/make_ui_kit.py path/to/ui_sheet.png
"""
import sys
from PIL import Image, ImageEnhance

src = Image.open(sys.argv[1]).convert('RGBA')
b = src.crop((62, 57, 227, 129)).resize((41, 18), Image.NEAREST)
# paint out the word: tile the plain wood columns 5..7 across the lettering rows
# (each row gets its most common plain-wood colour, which keeps the horizontal grain)
from collections import Counter
for y in range(4, 13):
    c = Counter(b.getpixel((x, y)) for x in list(range(4, 8)) + list(range(33, 37))).most_common(1)[0][0]
    for x in range(8, 34):
        b.putpixel((x, y), c)

# tidy the snow cap: a few grey/brown specks in its lower rows become snow
snow = b.getpixel((14, 2))
for y in range(0, 3):
    for x in range(3, 38):
        r, g, bb, a = b.getpixel((x, y))
        if a and not (r > 150 and g > 170 and bb > 190):
            b.putpixel((x, y), snow)

def tint(img, rgb, k):
    out = img.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, bb, a = px[x, y]
            if a == 0 or (r > 180 and g > 190 and bb > 200):  # leave the snow cap white
                continue
            px[x, y] = (int(r + (rgb[0] - r) * k), int(g + (rgb[1] - g) * k), int(bb + (rgb[2] - bb) * k), a)
    return out

rows = [b, ImageEnhance.Brightness(b).enhance(1.22), tint(b, (236, 178, 96), 0.55), ImageEnhance.Brightness(b).enhance(0.7)]
kit = Image.new('RGBA', (41, 18 * len(rows)))
for i, r in enumerate(rows):
    kit.paste(r, (0, i * 18))
kit.save('assets/img/ui/kit.png')
print('assets/img/ui/kit.png', kit.size)
