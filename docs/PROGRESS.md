# Progress notes (resume here)

## Done
- Engine, procedural audio, weather + day/night clock, snow depth, fire/oven upkeep, HUD, journal, focus timer.
- Watch mode ("Just watch") loops in every scene; jingle + props banner on success.
- Scenes: title, big top-down valley map, Long Walk trail (+ climbing cutscene), cabin, kitchen, porch & yard,
  frozen lake, forest (wildlife), summit, **chapel**, **wildlife encounters**.
- QA pass: 23 issues from the review subagent fixed (earlier session).

### This session
- **Canonical traveler** (PixelLab character f1665125…, 8 directions): bearded skeleton walk (trail, from behind on the
  climb), kneeling prayer, sitting from behind; new small bearded map walker (character 33f58feb…); new fishing pose
  on a stool (idle jig + reel) with per-frame rod-tip table so the line drops straight into the hole.
- **Chapel**: interior (pews, altar, candles, open Bible, cross, arched window with snow), top-down chapel with bell
  tower on its own path/clearing. Kneel & pray (KJV verses), light candles, ring the bell, read the Bible; a cardinal
  visits the window ledge; Waffles rests by the altar step. Hymn-like music + bell sound. Journal: prayers, candles.
- **Cabin**: wooden cross on the wall and a Bible on the side table (inpainted).
- **Valley map**: WASD / arrow keys walking on a walkable mask (paths, clearings, lake ice; buildings solid), Shift to
  hurry; signposts replaced by a small card popping up top-middle near a place (E / Enter / Space to go in). Paths
  are trodden snow (packed_snow_pro Wang tileset + boot/paw prints). Chopping block moved beside the cabin on snow.
- **Wildlife encounters** (src/scenes/encounter.js): random while walking the valley or the Long Walk flat; Waffles
  notices first ("!" + woof). Camera (3 unique PixelLab photos per animal: deer, elk, fox, hare, owl, cardinal, bear,
  incl. flight shots) or notebook sketch/note, or let it be. Bear: calm → photo/note (the shutter may agitate him);
  agitated → hold ←/A to back away slowly (no rushing). Journal "Photos" tab = album (click to enlarge).
- **Summit**: wishing removed. The traveler cuddles Waffles (PixelLab pair from behind, breathing loop); when a
  shooting star crosses at dusk/night both look up. Clouds are two seamless parallax banks woven from PixelLab cloud
  sprites, clipped behind the ledge; storms bring a grey overcast.
- **Long Walk**: new panorama with the path along the walk; every ~45–75 s a 24 s climbing cutscene (both from
  behind on a railed mountain trail, shrinking into the distance, breath puffs).
- **Lake**: hooked fish rises from the hole wriggling/gasping (PixelLab wriggle per species), miss = fish leaps,
  shakes the hook and splashes back; catch close-up = looking down at the fish in your mittens.
- **Kitchen**: PixelLab knit-band mug in the cocoa steps; the stir step is an animated close-up of his hands stirring
  with a spoon. Fish on the board/pan use the species sprites.
- **Mochi v2**: small grey tabby with realistic proportions (character b52145bf…), ~½ of Waffles' sitting height.
- **Weather everywhere**: winter day length (dark 18:00–6:30, dusk from 15:45), a properly dark night (tint now lands
  on characters too), storm overcast over skies, howling wind gusts, characters shiver in cold wind, trees sway
  (row-shear of tree regions per background). PixelLab chimney smoke puffs, snow heaps, woodpile.

## Done in the follow-up session
- **Mochi**: front-facing poses (loaf, washing, yawn) mixed with side poses, a long stretch after lying down, yawns;
  each rest picks a facing. Her paw (props/paw.png) sneaks into the cut/season card.
- **Couch**: new canonical traveler with cocoa and the small Mochi asleep in his lap (couch_sit, PixelLab loop),
  clipped behind the coffee table; steam comes from his mug.
- **Cooking, Coffee Talk style**: research notes — Coffee Talk keeps brewing to a few clear steps (base, primary,
  secondary ingredient) with a preview before committing, uses short comic-panel interludes (split screen, gentle
  camera pans) rather than full animation, and lets sound carry the action (the machine beeps give the flow). Applied:
  `SE.Panel` (src/actors.js) shows one still that slides in, drifts 1–2 px and plays timed sounds. The chop step is
  now: still of the hands at the board → cuts → descaling panel (scrape sounds) → head & fins panel (chops) → fillet
  panel → season/fry/plate use a PixelLab fillet sprite (props/fillet.png) instead of the whole fish.

## Moments (Coffee Talk-style cutscenes) and sound — latest session
- `src/moments.js`: `SE.moment(name, { go, then })` plays a little cutscene with no animation: dip to black while a
  sound starts the story, one PixelLab still (assets/img/cut/*.png, 240x136 drawn at 2x) fades in between letterbox
  bars, drifts 4px, one typed line of text, timed sounds carry the action, then it fades into the (new) scene.
  Click/Space/Esc skips; each moment has a 2-minute cooldown so they stay special.
  Moments: leave (yard → valley), home (yard → cabin), lake / chapel / summit / forest / trail (arriving from the
  map), alert (Waffles notices an animal → encounter), lantern (first time in the cabin after dark each day),
  cocoa (milk on the stove), chop / shovel / porch (yard activities), pray (kneeling in the chapel).
- Research basis: Coffee Talk is a visual novel that tells its story with commissioned illustrated stills and lets
  sound effects and music carry motion and atmosphere (rain, the brewing machine) instead of animating.
- Sound: much stronger synthesized snow crunch; new synth SFX creak, latch, stomp, icecrack, auger, rustle, twig,
  match, gust, scrape. Any `assets/audio/sfx_<name>.mp3` listed in `assets/audio/index.json` replaces the synth
  (`sfx_step1..N` are picked at random). `tools/gen_sfx.py` generates all of them with ElevenLabs — the proxy-injected
  ElevenLabs credential was rejected (401 invalid authorization header) this session, so the files are not there yet:
  reconnect ElevenLabs, then run `python3 tools/gen_sfx.py`.

## Still open from the user's requests
- Coffee Talk treatment for the cocoa steps (pour / scoop / marshmallows as stills + sound).
- Mochi from more angles while walking (only side walk exists) and a proper lap-hop when he sits down.

## Next
1. Remaining old (non-canonical) traveler sprites: chop, porch rocking chair, shovel. Regenerate from the canonical character at each scene's scale.
2. Petting close-up still uses cat_sit at 3x (now the new Mochi); maybe a dedicated close-up sprite.
3. Cinematic idle scenes: choreographed loops (walks between marks, Mochi lap hop, Waffles fetch/pets/naps).
4. Beautiful pixel UI (panels, buttons, icons, font) and a full Settings screen.
5. Day variant of bg_summit (the sky is painted as a sunset; noon still looks like evening apart from the tint).

## Notes
- PixelLab: ~1,600 generations left this cycle (Tier 1, 8 concurrent jobs, resets 2026-11-13).
  backblaze.pixellab.ai is blocked by the egress proxy: download characters via
  `https://api.pixellab.ai/mcp/characters/<id>/download` (zip) and images via `/mcp/images/<job>/download?index=N`.
  Uploads: `get_upload_url` then `curl -F file=@x.png <url>` → `upload:<id>`; inpaint is limited to 256 px on Tier 1
  (crop, inpaint, paste back).
- Local test: `npx http-server -p 8123 .` then `NODE_PATH=$(npm root -g) node tools/screenshots.cjs`
  (CHROME=/opt/pw-browsers/chromium in the cloud container). Rebuild the valley ground with `python3 tools/build_world.py`.


## Mobile / touch (iPhone)
- `src/touch.js`: turns on with the first touch (or `?touch`). Floating thumb-stick on the left of the valley (push to the rim to hurry), tap the place card to go in, hold button to back away from a bear. Other scenes were already tap-friendly.
- Engine: `SE.pointerFilter` lets touch controls claim a pointer; `SE.vkeys` feeds `SE.held`; audio also unlocks on pointerup (iOS); `navigator.audioSession.type = 'playback'` so sound plays with the silent switch on.
- index.html: viewport-fit=cover, no zoom / text selection, a "turn your phone sideways" card in portrait.

## Round: encounters, night light, the cabin door
- Encounters are rare now: at least 5 minutes of play between any two (SE.encounterReady), and 3000–5200px of walking (valley) / 4–7 min (Long Walk).
- Waffles in encounters: new PixelLab `dog_cautious` (Berni v2, v3 anim): stands tense by the traveler, head low and stretched toward the sound, sniffing; bristles when the bear is agitated, relaxes (sits) when the animal leaves.
- `bg_forest_dim` (PixelLab edit of bg_forest without sunbeams): SE.drawForest crossfades to it whenever the sun is not out (snowfall, storms, dusk, night). Encounters/Pines get full night tint + SE.moonlight + a lantern glow around the traveler.
- Night lights: assets/img/lit/* hold only the lit window pixels; SE.nightLights draws them AFTER the night tint with halos and pools on the snow (yard, valley cabin + chapel), also during storms. Chimney smoke is now tinted with the night.
- Cabin: PixelLab-inpainted front door in the right wall (cross moved above the coat peg, the coffee-table book is now the Bible). The door swings open with the outside visible, cold light and a gust of snow when you come in (from the yard/map) or step out (click the door). Mochi can wait on the doormat.

## Round: real bear, weather stills, honest fish
- Bear: the dancing hind-leg strip is gone. Agitated = PixelLab `bear_bluff` (on all fours, head low, ears back, a front paw slapped into the snow with a thud, pause, repeat). Calm bears forage and every ~11 s lift a paw and test the air (`bear_sniff`).
- Cutscene stills exist per condition: day (sunny spell), snow (overcast + snowfall), storm (windy/storm), night. BASE in src/moments.js says which one the original file is; the others are cut/<name>_<variant>.png (33 PixelLab edits). The moment picks the right one when it starts. Cocoa (indoors) and lantern (always dusk) have one version.
- Kitchen: no sprite fish sliced on a drawn board any more. Cutting shows only the painted stills (kitchen_cut, scaling, head/fins, the open fillets), seasoning sprinkles dill onto the open-fillet still, frying is a PixelLab animation of the two open fillets in the pan (`kitchen_fry_raw`, then `kitchen_fry_gold` after the flip), and the plate is a PixelLab dish (props/dish).
- iOS: resize again shortly after rotations (stale sizes blew the canvas up past the screen).

## Round: everything without a skill is a cutscene
- Cutscene variants: painted variants where they exist; otherwise src/moments.js relights the still in code (night = moonlit blue that keeps lamps/candles/windows warm, storm = whiteout, snow = cooled, day = warmed; indoor stills only day/night). Live snowfall of the current weather falls over outdoor stills.
- Encounters (src/scenes/encounter.js) are stills only: Waffles notices (alert) → dark pause "Something in the woods got Waffles' attention…" → reveal still per animal (cut/see_*) → choose photo (camera still → the print) / note (pencil still → notebook page) / let it be. Bear: maybe agitated (cut/see_bear_angry) → only "Back away slowly" → cut/retreat + a dark beat.
- Kitchen: cocoa = cocoa_chop, cocoa2, cocoa_cook, cocoa_pour; fish = cook_prep, cook_pan, cook_fry, cook_plate; then dinner (cut/eat) with a choice to share: treat_dog / treat_cat. No minigames, no panels, no Mochi paw.
- Woodlot (src/scenes/woodlot.js, map place next to the cabin): its own clearing (bg_woodlot: lean-to woodpile, felled trunks). Chopping is the one skill; after 5 good splits → cutscene stack + carry_in → cabin, fire +.
- Chapel: back-wall door matching the outside door (where the logs were). Cabin: new Bible on the coffee table; "Read the Bible" (button or click the Bible) → bible_read still + a verse beat; verses are kept in the notebook.
- Notebook (src/notebook.js): book button → cut/pocket still → a real open notebook (ui/notebook.png) with 4 spreads: notes & wildlife sketches, photo album (click to enlarge), fish & kitchen, Bible notes & chapel.
- Lantern at night / headlamp in heavy weather (SE.travelerLight) on the map, Long Walk, lake, summit, woodlot.
- Just watch → cutscene of putting headphones on; while watching he wears headphones (SE.headphones) with notes floating up (couch, summit, lake, woodlot, trail).
- Bedroom (src/scenes/bedroom.js): bed, lamp, Mochi on the quilt, Waffles on the rug; "Go to sleep" only at night → cut/sleep with zzz from all three → morning (clock 7:12, new day).
- Mochi v4 (PixelLab character ef64e189…, smaller): walk SE/SW/NE/NW, sit (SE, mirrored), loaf SE/SW, jump SE/SW. No side views; she loafs on counters, shelves, the couch back and the quilt.
- PixelLab budget: ~45 generations left until 2026-11-13.

## Round: title menu, settings, wooden UI, mobile fit
- Title (src/scenes/title.js): "Continue · day N" when a journey is saved (resumes the scene you were in), "New journey" (asks first, then wipes the save) and "Settings" (music / ambience / effects, screen size, weather, time, UI fade). The save is kept in localStorage as before.
- Mobile: the canvas is sized from visualViewport minus the safe-area insets (notch, home bar), and a "Screen size" slider (title settings and the HUD sound panel) shrinks the whole game if a browser still covers the buttons.
- UI skin: PixelLab UI sheet (create_ui_asset) → tools/make_ui_kit.py → assets/img/ui/kit.png, a snow-capped walnut plank with gold rivets in four states (normal, hover, honey-gold active, dim). SE.button and the standard SE.panel draw it as a nine-slice; panels with their own colour keep the flat style.
- Woodlot: the big felled trunks and the stump stay. The traveler was the thing out of proportion (a 57px sprite with its own little stump), so he is now chop_big: a PixelLab inpaint of him at full adult size standing at the clearing's own stump, animated with animate_image (14 frames: axe up, the swing, the log splits, the axe comes back up), drawn over that 128x128 corner of bg_woodlot. The thunk and chips come at the impact frame; a glancing blow stops the swing short. Waffles stays lying in the snow and after every good split barks from where he lies and grins (dog_lie_cheer); the lake uses the same lying cheer when a fish bites.
- Cabin: Mochi no longer sits in the middle of the couch. Her spots are the two armrests, the corner of the couch back, the window sill, the bookshelf top, the coffee table, the rug and the doormat.
- PixelLab budget: 119 generations left until 2026-11-13.
- Couch: the cross-legged sprite (which looked like he sat on the coffee table) is gone. couch_scene is a PixelLab inpaint of the living room: he leans back on the left cushion in a knit sweater, his socked feet up on the seat, the boots on the rug, Mochi asleep on his lap. A sip plays couch_sip (PixelLab animate_image, 10 frames): the mug goes up to his lips and back down, with the slurp halfway.
- Couch: repainted in one pass from the clean room (body, legs, feet and boots together) so the couch colours behind the legs match, then two small touch-ups for the toes and the boots; couch_sip re-animated from the new painting (12 frames).
- Headphones are parked (SE.HEADPHONES = false): drawn on top of the beanie they never sat on his ears in any scene. The "music" put-them-on cutscene is skipped too. Future feature: paint headphones into his sprites/stills (PixelLab edit of each pose) and switch the flag back on.
- Bible reading still (cut/bible_read): his beard was painted grey; recoloured to his brown beard (pixel recolour, no new generation). The other stills were checked and already show a brown beard.
- Couch sip: two frames where his eye was missing got his closed eye painted back in.
