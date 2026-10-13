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

## Next
1. Remaining old (non-canonical) traveler sprites: couch_sit (also has the old big Mochi on the lap), chop, porch
   rocking chair, shovel, kitchen poses. Regenerate from the canonical character at each scene's scale.
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
