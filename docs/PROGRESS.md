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
  (`sfx_step1..N` are picked at random). `tools/gen_sfx.py` generates all of them with ElevenLabs. Done: all 26 are in assets/audio (the network secret now holds a working `sk_` key with sound-generation access); sounds without a file (sip, whoosh, soft…) stay synthesized.

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

## Round: Whispering Pines as cutscene trips
- src/scenes/forest.js is now all stills: arrive (cut/forest), a waiting beat in the dark, then ONE animal per trip in three stills (cut/pines_<animal>_1..3, PixelLab pixflux img2img from each see_* still, 5.4 s each with its own sounds). Fox tracking/listening/mousing pounce, hare nibbling/owl shadow/sprint, owl staring/swooping/fluffed (night only), cardinals berries/pair/fly-off (never in heavy snow or wind), deer browse/alert/bound, elk bugle/paw/herd, bear on a deer's trail/stalking/gives up (never in a storm, may turn agitated → back away).
- Some trips nobody comes (14 %, more in snow, 40 % in a storm): "Wait a little longer" twice, or head back.
- One photo per trip: a beat you don't have yet in the current light/weather → pinesAlbum[kind] = ['<beat>_<cond>']. Slots: 3 beats × day/snow/storm/night (owl: night, snowy night; bird: day, snow; bear: day, snow, storm) = 69 photos.
- Sketch: one sitting per trip (on walks too), finished after hare 3, bird 3, deer 4, fox 4, elk 5, owl 6, bear 7 sittings (SE.sketchTrips). The page draws itself in from left to right (SE.drawSketchPage).
- Notebook: a field-guide spread per animal (??? until seen, hint where/when to find it; sketch progress; photo grid by light/weather; the 3 trail prints). The first page's grid jumps to each animal.
- New ElevenLabs sounds: sniff, hop, growl, huff, hoot, chirp, yip, bugle, wings, pounce, scribble, page. Encounter reveals use each animal's call and last longer (5.2 s).
- Living room: the mantel lamp (the twin of the bookshelf lamp) is painted out (PixelLab inpaint) and its glow removed.
- Sound pass 1: new ElevenLabs footsteps (deep, soft, low-passed crunch, played quieter), wooden-floor steps (SE.audio.woodSteps) when walking between cabin rooms and into the chapel, a real sip, page turns and pencil scribbles for the notebook, sketches and Bible reading. Recorded 20 s loops amb_fire (crackling fireplace) and amb_wind (soft wind in the pines, no more rain-like hiss) replace the synthesized fire and calm wind; the synth wind only adds to storms.
- Just watch no longer acts for you: he settles on the couch (cabin) or simply stays where he is; no auto chopping, cooking, fishing, sleeping, errands.
- Woodlot: Waffles barks (lying down) only once the round of 5 splits is done.
- Snow: up to 1200 flakes; a sunny spell has barely any, gentle snow ~2× as before, heavy snow and storms a lot.
- Valley: boot prints (a dent with a rim of pushed-up snow) and paw prints that new snow fills in — 30 s in sun, 13 s in light snow, 7 s heavy, 4 s in a storm.
- Cabin: Waffles and Mochi are drawn before the night tint, so at night they sink into the dusk; the fire rims Waffles' back.
- Lake: the hole refreezes like a real one (SE.lakeMoment): still open within ~1.5 game hours, a thin skin you tap open within ~10 h (lake_skim), otherwise frozen solid → drill a new one.
- Kitchen lanterns are cold in daylight (props/kitchen_unlit.png overlay) and lit with their glow after dusk.
- Fire out: no chimney smoke, a one-time hint outside, and lighting a cold hearth plays fireStart (cut/fire_lay: hands laying kindling on a cold sooty grate — PixelLab inpaint of the whole fireplace front; cut/fire_light: the match).
- Rocking chair: longer cutscene, then an idle screen with the PixelLab animation cut/porch_rock_0..15 (animate_image of porch2: rocking, sipping, Waffles breathing), bright daylight relight, creak + sip each loop; not in a snowstorm.
- Text: small text now uses bitmap pixel fonts at their native 10px (Tiny5; Micro 5 for size-6 notes) — Pixelify Sans at 8px blurred B/G together and fused "fi" into an "A" ("Arewood"). Headings ≥12px stay Pixelify. A zero-width non-joiner also keeps f+i/l apart.
- Fewer hearts: none on banners or celebration bursts (sparkles only), none on buttons, rare when stroking Mochi. New ElevenLabs reward jingle (sfx_jingle: soft music box and bells).
- Mochi v5: every existing animation (walk ×4, sit, jump ×2, loaf ×2 — 74 frames) upscaled 1.5× and reskinned with PixelLab transfer_outfit to match her cutscenes: a chunky, fluffy grey tabby with dark stripes, white chest, muzzle and paws (~36px instead of ~25px). Same poses and timing.
- Entrance hall (src/scenes/hall.js, bg_hall: PixelLab redraw of the cut/home still at full room size, cat removed): the only room with the front door. "Step outside" plays leaveHome: cut/leave_out (the home still inpainted: door open to the snow, his silhouette and Waffles walking out, Mochi watching, the coat gone from its hook) → yard. Coming in plays the home still and lands in the hall.
- Living room back to its original right side (tall window, low bookshelf; the door is gone), with the single mantel lamp, the Bible on the coffee table and the green book now on the low shelf (PixelLab inpaint). Mochi's doormat spot became the low shelf top.
- Bedroom: the door is painted out — a freestanding wardrobe with two potted plants beside it, no coat rack. Mochi's rug spots no longer overlap Waffles (bedroom and living room).
- Lighting (src/lighting.js): SE.drawAnim records every character sprite drawn in a frame and SE.glow records every light (fire, lamps, lanterns, lit windows, headlamp). Before the HUD, each sprite near a light gets a rim of the light's colour on the side facing it plus a soft wash over the body, clipped to the sprite's pixels; lights a character carries don't outline himself. Outdoors after dark a faint cool moon rim falls from above. Indoors lamps/fire count by day too; outdoors only after dusk.
- Headlamp: SE.travelerLight takes the forehead position per scene (woodlot, lake, summit, Long Walk) and draws the strap and lens on his beanie, the beam starting there. The woodlot lantern stands next to him in the snow.

### Light sources, lantern, leaving still
- Kitchen and living room after dark: `SE.weather.interior(ctx, lights)` cuts the night dim away around the room's real light sources (oven fire / fireplace, lit lanterns and lamp), so the flames visibly light their corner and the rest falls into shadow. The oven firebox gets a brighter flickering flame glow plus a warm spill on the floor.
- Traveler's light: headlamp only in a real snowstorm; any other night he carries a PixelLab oil lantern sprite (`props/lantern.png`) with a calm, steady glow (half size on the map). It throws a stronger glow and a warm pool on the snow; in the woodlot it stands by the chopping block, clear of Waffles; at the lake it stands on the ice behind him and Waffles (`SE.lanternBehind` draws it before them, then only its glowing glass is redrawn over the night tint).
- `cut/leave_out`: beanie removed from the hook and Mochi removed from the shot (PixelLab inpaint).

### Fish dishes, mugs, discovery + notebook map, icons
- Cooking: each fish has its own cutting-board still and plate (`cut/cook_prep_<char|white|pike|perch>`, `cut/cook_plate_*`; the trout keeps the originals), its own lines and dish name (Seared Arctic Char, Butter Whitefish, Crumbed Pike, Fried Perch, Pan-fried Trout). Old saves' "Pan-fried Fish" counts move to the trout.
- Cocoa: "Make hot chocolate" opens a mug shelf (`SE.MUGS`, 6 mugs: red, enamel camp, pine tree, pottery, Waffles' paw print, Mochi's sleeping cat), each with its own pour still `cut/cocoa_pour_<id>`; `save.mugsUsed` tracks them.
- Places must be discovered: within 92px on the map a place is found (`SE.discoverPlace`, banner + scribble), only then it gets its card and signpost arrow. `save.seenMap` records the 64px cells you walked through.
- Notebook "Valley map" spread (2nd): a pencil/ink map drawn in code from `world_layout.js` (inked pines, dashed paths, lake wash, peak), revealed only where you have walked; found places get a little picture and their name.
- Map woodcutting icon: the axe now leans against the stump (PixelLab inpaint). HUD: the notebook icon is a ringed notebook with a pencil; watch mode shows "Stop watching" with a stop icon.

### Achievements (`src/achievements.js`)
- 33 hidden achievements, each with its own PixelLab icon (`assets/img/ach/<id>.png`; the sketch ones are toned to pencil): a full sketch of each animal (7) and of all, every photo of each animal (pines album in all conditions + the 3 trail prints) (7) and the whole album, the summit in all four weathers by day and night, every fish caught, every mug used, petting Waffles and Mochi daily for 7 days in a row, shoveling in heavy snow, meeting every animal on the trails, the fire never out for 24 in-game hours, cooking every fish, idling 1/2/4/8 real hours, finding every place, staying up through the night (awake 10h+ when 6:00 comes), all ten chores in one day (fire, oven, cook, cocoa, shovel, chop, fish, pet both, Bible), just-watching in all 8 idle corners, a shooting star with Waffles.
- Scenes report events with `SE.ach.note(...)`; everything else is checked from the save once a second. Unlocks queue a small "Achievement unlocked" card (icon + name, chime).
- Notebook: two "Achievements" spreads (12 per page, "?" until earned, hover for name + description), and a clickable "Achievements n/33" line on the first page.

### Soundtracks
- Seven new synthesized songs in the same quiet lo-fi style: Cocoa Steam, Snow on the Sill (music box), Study Lamp (cabin), Pine Trail, Blue Hour (outdoors), Candlelight (chapel), next to Fireside, Valley Air and Vespers.
- Each place has a playlist; a song plays ~4 minutes and the next takes over on a bar line, so long work/study sessions don't loop one tune. The sound panel shows "Now playing" and has a "Next song" button.

### Font
- Back to Pixelify Sans for all text, as before (the Tiny5 / Micro 5 small-text fonts are gone). The "fi" fix stays: a zero-width non-joiner keeps "fi"/"fl" from merging into the font's ligature glyph.

### Slower walk
- On the valley map he walks at 24 px/s (was 34), 44 with Shift (was 60), scripted walks 21 (was 28); the stride animation and footstep sounds slowed to match.

### Whispering Pines trips, sketch progression, and a big polish round
- Pines: the trip opens black (Waffles sniffing, no glimpse of a picture first) and shows ONE moment of the animal; its three moments are seen in order over three trips (`save.pinesBeats`). Then one chance: a photo (of that moment, in the current light) OR a sketch sitting, and the animal is gone (`pines_gone`) and you head back.
- Sketch progression: each animal has a notebook still per sitting (`cut/sketch_<kind>_<n>`, fox 4, hare 3, deer 4, elk 5, bird 3, owl 6, bear 7). Built by `tools/build_sketch_stages.py` from a PixelLab finished pencil sketch per animal (`assets/img/sketch_src/<kind>.png`) on a PixelLab close-up of the notebook (`sketch_src/page.png`): faint underdrawing, then outlines, then shading; hidden under the glove where it overlaps; then `tools/sketch_notes.cjs` writes the name and field notes (one more line per stage) in the game font. The field guide shows just the drawing (`assets/img/sketch/<kind>_<n>.png`, no page, glove or pencil) set straight onto the notebook paper.
- Notebook: red ribbon lies across the page; sticky-note tabs (Notes, Map, Wildlife, Kitchen, Word, Awards) jump to sections. HUD notebook icon is a small colour open book; "Stop watching" has a step-out icon.
- Focus timer only counts while you just watch (paused otherwise); its panel leads you to "Just watch & focus", and the clock glows while you watch without a timer.
- Chapel: no bell; he lights a candle before praying if none burns; new prayer still at the altar (no book). Leaving the chapel: the door closing on the candlelight (inpainted from the arrival still). Leaving the summit: one last look, then down the ridge.
- Long Walk: its own trail still (contrast/colour boosted), not the summit climb.
- Sounds (ElevenLabs, levelled): deeper Waffles bark, real bear growl/huff, softer page turn, a Bible page, snow shovel scrape + toss, Mochi's meow (now and then, and in petting), wooden floor steps, a deep roaring fire loop, a soft rocking-chair creak (only now and then; sips every 25–50 s), valley birdsong chirps by day.
- Petting plays one still, never the same twice in a row.
- No snow piles; shoveling is optional, the path never blocks.
- Kitchen: Mochi only on the sill, the clear end of the island, or the floor; drawn under the night so she sits in the dark like the room. Mochi frames are planted on their surface (per-frame foot gap); bedroom chest and living-room perches measured to the art.
- Lighting: bedroom lamp glow sits on the lamp (not the pillow) and lights the room after dark; windows show daylight by day (glass repainted from the backdrop), the chapel beam is warm by day; map cabin/chapel only glow at windows and the door; map cabin has its porch (PixelLab inpaint); valley lantern is a tiny lantern hanging from his hand.
- Bigger fish in your mittens; a still of the chopped chocolate dropping into the pot; cutscenes that start on a scene change open fully black (no one-frame flash of the next room); floating place signs on the map removed.

### Prayer animation, verses, Long Walk pacing, cocoa sounds
- Chapel: a new PixelLab prayer animation in the woodlot-chop style (`trav_pray`, 18 frames of 96 px). He stands bareheaded with the beanie in his hand, kneels down onto both knees, folds his hands around the beanie and bows his head; then a held, gently breathing loop. Built from the chop sprite: an edit gave the bareheaded standing key, a second edit the kneeling key, both redrawn crisp at chapel scale; `animate_image` interpolated the kneel and a second pass made the breathing loop. New prayer still: kneeling at the altar in his own coat, beanie in hand.
- Verses: 78 KJV verses (was 10). The cabin Bible gives a passage he hasn't noted yet; in the chapel he prays over the passages he studied by the fire (the notebook's "Notes from the Word"), falling back to any verse before he has read there.
- Home still: the traveler stands in the entry in his couch clothes (rust cable-knit turtleneck, red beanie), boots off on the mat, with Mochi looking up at him (PixelLab inpaint of the old still; the day/storm versions are rebuilt from it).
- Long Walk: walks at the valley pace; no "Walk faster" button; a single trail still now and then between stretches of walking (never the same twice in a row), with a second, figure-free trail still.
- Woodlot: the lantern on the woodshed lights up after dusk (a warm pool that also rim-lights him). Chop animation: detached, inconsistent wood chips removed from the frames.
- Cocoa: one pour (no more pouring over and over), a cocoa powder sound for the spoons, a stirring sound, the chocolate plops into the milk, and no sip at the end.
- Chapel prayer: he stays kneeling (watch mode no longer stands him up; only "Stand up" does), and every 20–40 s he lifts his eyes to the cross, rests there a few seconds and bows his head again (9 more PixelLab frames interpolated from the kneeling pose; a cross PixelLab drew into the air was erased).
- Chapel scale: the prayer animation was rebuilt at 128 px, the woodlot chop's own scale (about 90 px standing), measured against the chapel door and altar; at the old 96 px size he looked like a child. 28 frames: stand, kneel, breathing hold, look up to the cross.
- Home still: the traveler redrawn with realistic adult proportions (small head, long legs) from a proportion guide built from the game sprite, in the couch outfit; day/storm rebuilt.
- Sound: the fireplace and wind loops had been empty 462-byte files since they were first made, so the fire only clicked. Both regenerated with ElevenLabs (a warm log fire, EQ-shaped so the crackle is woody, not jingly: nothing above ~5 kHz, body at 900 Hz–2 kHz; soft wind in the pines), made into seamless loops (the end crossfades into the start) and levelled; the loop player skips the encoder's silent edges.
- Mobile: the thumb-stick no longer switches to the hurry pace at its rim; he always walks at the calm valley pace.
- Mochi never floats: the kitchen island spot moved from the island's back edge (where she hung in front of the cabinets) to the open middle of the top between the lantern and the spice jar; the bedroom chest and the living-room bookshelf spots were narrowed so she never overhangs their ends. Checked by compositing her sit and loaf poses at both ends of every surface onto the room art.
- Rocking chair: the porch stills and the 16-frame rocking loop now share one light for every time and weather it can be used in (not in a snowstorm, when the chair is off and watch mode goes to the woodlot instead). Painted at sunset with the lantern lit, that is their dusk; by day the pink is turned into a blue sky (sunny), a cool overcast (gentle/heavy snow) or a greyer sky (windy), colours kept rich, and the lantern glass is dark; at night it is deep blue with the lantern and windows glowing and a warm pool of lantern light on him and Waffles. The old washed-out painted porch_snow/storm/night versions are gone; the rocking loop follows the weather too.
- Petting Waffles sounds like it: hands rubbing through his thick fur, his happy breathing and snuffling, then the deep contented groan of a big dog being scratched (three new ElevenLabs sounds, levelled); no more bark while he's being petted.
