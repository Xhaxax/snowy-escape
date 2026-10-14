#!/usr/bin/env python3
"""Generate the game's sound effects with the ElevenLabs sound-generation API.

usage: python3 tools/gen_sfx.py [name ...]      (no names = all missing ones; --force regenerates)

Writes assets/audio/<name>.mp3 and assets/audio/index.json (the list the game loads). Each file
replaces the synthesized sound of the same name in src/audio.js (sfx_<name> ↔ SFX.<name>;
sfx_step1..N are picked at random for footsteps). Auth: set ELEVENLABS_API_KEY, or run where an
egress proxy injects the ElevenLabs credential.
"""
import json, os, sys, time, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'audio')
API = 'https://api.elevenlabs.io/v1/sound-generation'

SNOW = 'one single slow footstep of a heavy winter boot sinking into deep soft fresh snow, a soft deep satisfying crunch, warm and muffled, low pitched, gentle, no squeak, no hiss, no music'
WOOD = 'one single heavy footstep of a winter boot on old wooden cabin floorboards, a deep hollow knock with a soft creak, indoors, no music'
SOUNDS = {
    # walking: several takes so steps never repeat
    'sfx_step1': (SNOW, 0.6), 'sfx_step2': (SNOW + ', slightly heavier', 0.6), 'sfx_step3': (SNOW + ', lighter and faster', 0.5),
    'sfx_step4': (SNOW + ', sinking deeper into a drift', 0.7), 'sfx_step5': (SNOW + ', on packed trodden snow, sharper squeak', 0.5),
    # cutscene beats: the picture stays still, the sound tells what happens
    'sfx_creak': ('old heavy wooden cabin door slowly creaking open, iron hinges, quiet room', 1.6),
    'sfx_latch': ('wooden door closing with a soft thud and an iron latch clicking shut', 0.8),
    'sfx_stomp': ('two boots stomping snow off on a wooden porch, muffled thumps, snow falling off', 1.2),
    'sfx_icecrack': ('deep resonant crack spreading through thick frozen lake ice, eerie ping', 1.6),
    'sfx_auger': ('hand ice auger drilling into thick lake ice, grinding and scraping, ice shavings', 2.5),
    'sfx_rustle': ('something rustling between snowy pine branches, snow sliding off a branch', 1.2),
    'sfx_twig': ('a dry twig snapping in a quiet snowy forest', 0.5),
    'sfx_match': ('a wooden match striking and flaring, then an oil lantern wick catching fire softly', 1.6),
    'sfx_gust': ('a cold mountain wind gust howling over a snowy ridge, swelling then fading', 3.0),
    'sfx_bell': ('a small chapel bell ringing once far away across a snowy valley, long reverberant tail', 3.5),
    # everyday sounds
    'sfx_door': ('cozy log cabin door opening and closing, small bell', 1.2),
    'sfx_chop': ('axe splitting a dry firewood log on a stump, sharp crack', 0.8),
    'sfx_splash': ('small fish splashing out of an ice fishing hole, water droplets', 1.0),
    'sfx_reel': ('small fishing reel clicking fast as line is reeled in', 1.0),
    'sfx_pour': ('pouring cold milk from a jug into a small metal saucepan', 1.6),
    'sfx_sizzle': ('fish fillets sizzling in butter in a cast iron pan', 2.5),
    'sfx_scrape': ('knife scraping scales off a fresh trout on a wooden board', 1.0),
    'sfx_purr': ('a small cat purring contentedly, close', 2.0),
    'sfx_woof': ('a big friendly Bernese mountain dog giving one happy bark', 0.7),
    'sfx_camera': ('vintage film camera shutter click and film advance lever', 0.8),
    'sfx_pop': ('soft wooden ui click, cozy', 0.5),
    # inside: boots on the floorboards of the cabin and the chapel
    'sfx_wood1': (WOOD, 0.6), 'sfx_wood2': (WOOD + ', a little louder creak', 0.6), 'sfx_wood3': (WOOD + ', softer', 0.5), 'sfx_wood4': (WOOD + ', a squeaky board', 0.7),
    'sfx_sip': ('a man taking a small slow sip of hot chocolate from a ceramic mug, a soft slurp and a contented exhale, close', 1.4),
    # long loops for the ambience (they replace the synthesized wind and fire)
    'amb_fire': ('a cozy wood fire crackling and popping in a stone fireplace, steady warm crackles and soft hiss of burning logs, close, continuous, no music, no voices', 20.0),
    'amb_wind': ('gentle cold winter wind blowing softly through snowy pine trees outdoors, calm low whoosh, continuous, no rain, no birds, no music', 20.0),
    # Whispering Pines: the animals
    'sfx_sniff': ('a deer sniffing the cold air, short quick nasal sniffs, quiet snowy forest', 1.4),
    'sfx_hop': ('a snowshoe hare hopping through soft powder snow, three soft quick thumps', 1.2),
    'sfx_growl': ('a grizzly bear giving a low deep rumbling growl, distant, snowy forest', 2.0),
    'sfx_huff': ('a bear huffing and blowing air through its nose, two sharp huffs', 1.2),
    'sfx_hoot': ('a great grey owl hooting softly at night, deep slow hoo hoo hoo, quiet winter forest', 2.4),
    'sfx_chirp': ('a northern cardinal bird chirping, bright short metallic chip notes, winter morning', 1.6),
    'sfx_yip': ('a red fox giving two short high yips in a snowy forest, distant', 1.2),
    'sfx_bugle': ('a bull elk bugling, a long high whistling call echoing through a cold valley', 3.0),
    'sfx_wings': ('large owl wings flapping silently a few times, soft whoosh of feathers', 1.2),
    'sfx_pounce': ('an animal pouncing head first into deep powder snow, soft heavy whumpf', 0.8),
    # the notebook
    'sfx_scribble': ('a pencil sketching quickly on paper in a notebook, soft scratchy strokes', 2.0),
    'sfx_page': ('turning a page of a small paper notebook, crisp paper rustle', 0.7),
}


def generate(name, text, dur):
    body = json.dumps({'text': text, 'duration_seconds': dur, 'prompt_influence': 0.55}).encode()
    headers = {'Content-Type': 'application/json'}
    if os.environ.get('ELEVENLABS_API_KEY'):
        headers['xi-api-key'] = os.environ['ELEVENLABS_API_KEY']
    req = urllib.request.Request(API, data=body, headers=headers, method='POST')
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
    with open(os.path.join(OUT, name + '.mp3'), 'wb') as f:
        f.write(data)


def main():
    os.makedirs(OUT, exist_ok=True)
    force = '--force' in sys.argv
    names = [a for a in sys.argv[1:] if not a.startswith('--')] or list(SOUNDS)
    for name in names:
        path = os.path.join(OUT, name + '.mp3')
        if os.path.exists(path) and not force:
            continue
        text, dur = SOUNDS[name]
        try:
            generate(name, text, dur)
            print('ok  ', name)
        except urllib.error.HTTPError as e:
            print('fail', name, e.code, e.read()[:200].decode('utf8', 'replace'))
            if e.code in (401, 403):
                break
        time.sleep(0.4)
    have = sorted(f[:-4] for f in os.listdir(OUT) if f.endswith('.mp3'))
    with open(os.path.join(OUT, 'index.json'), 'w') as f:
        json.dump(have, f)
    print('index:', len(have), 'sounds')


if __name__ == '__main__':
    main()
