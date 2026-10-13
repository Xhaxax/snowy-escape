// Layout of the valley overworld, shared by the game (src/scenes/map.js) and the terrain
// builder (tools/build_world.py, which auto-tiles it with the PixelLab Wang tilesets).
window.SE_WORLD = {
  "W": 1440, "H": 896, "cell": 16,
  "nodes": {
    "cabin": [300, 684], "a": [430, 708], "b": [560, 650], "c": [610, 490], "d": [470, 372], "forest": [262, 262],
    "e": [770, 452], "f": [890, 536], "lake": [972, 612], "g": [860, 346], "h": [990, 292], "summit": [1148, 238],
    "i": [650, 772], "trail": [720, 890]
  },
  "edges": [
    ["cabin", "a", [372, 712]], ["a", "b", [500, 706]], ["b", "c", [620, 580]], ["c", "d", [540, 400]], ["d", "forest", [360, 330]],
    ["c", "e", [690, 452]], ["e", "f", [830, 500]], ["f", "lake", [940, 560]], ["e", "g", [800, 380]], ["g", "h", [930, 300]],
    ["h", "summit", [1080, 290]], ["b", "i", [610, 722]], ["i", "trail", [700, 826]]
  ],
  "lake": { "cx": 1112, "cy": 616, "rx": 128, "ry": 84 },
  "clearings": [
    { "x": 300, "y": 640, "r": 104 }, { "x": 262, "y": 236, "r": 86 }, { "x": 1112, "y": 616, "r": 150 },
    { "x": 1150, "y": 210, "r": 70 }, { "x": 720, "y": 880, "r": 40 }
  ],
  "objects": [
    { "img": "map/mountain_td", "x": 1040, "y": 40, "solid": [1060, 60, 200, 150] },
    { "img": "map/cabin_td", "x": 244, "y": 566 },
    { "img": "map/chop_td", "x": 360, "y": 660 },
    { "img": "map/fishing_td", "x": 1090, "y": 600 }
  ],
  "signs": { "cabin": [352, 712], "forest": [304, 300], "lake": [1000, 590], "summit": [1112, 262], "trail": [748, 868] }
};
