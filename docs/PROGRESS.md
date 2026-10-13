# Progress notes (resume here)

## Done
- Engine, procedural audio, weather + day/night clock, snow depth, fire/oven upkeep, HUD, journal, focus timer.
- Watch mode ("Just watch") loops in every scene; jingle + props banner on success.
- Scenes: title, big top-down valley map (PixelLab pro Wang tiles + map objects), Long Walk trail,
  cabin, kitchen (Mochi on counter / eager while cooking), porch & yard (chop, shovel, rocking chair),
  frozen lake (animated fisherman + reel, 5 fish species), forest (wildlife), summit.
- QA pass: 23 issues from the review subagent fixed.

## In flight on PixelLab when we paused (fetch with tools/fetch_anim.sh JOB NAME FPS)
- d88d655a-b2e3-493a-96b9-b1bb62895944 -> fox_sniff (6 fps)
- 5fd703a6-ee2d-4be9-a5ce-3ed9f125b1c6 -> hare_sniff (5 fps)
- c75c6550-2aff-422a-a815-a5ae88ab4669 -> owl_idle (5 fps)
- fafd7d9e-1ac9-444f-a7f2-15b8ce39a0df -> bird_peck (8 fps)
- ed4d2331-08fa-4ff1-901c-ab072a2e4388 -> canonical traveler reference (create_image_pro, 4 candidates)

## Next
1. Canonical traveler: regenerate every pose from the reference at each scene's scale
   (cabin/kitchen large, yard small, lake/summit medium); small Mochi for cabin/kitchen;
   fix couch seating.
2. Cinematic idle scenes: choreographed loops (walks between marks, Mochi lap hop,
   Waffles fetch/pets/naps) that still allow interaction.
3. Summit pair from behind + forest hide sprite; a few animals on the big map.

## New direction from the user (next sessions)
- A beautiful pixel UI that fits the PixelLab art (panels, buttons, icons, font) and a full Settings screen.
- Idle scenes must feel like a movie / video, not sprites pasted onto backgrounds:
  - Scenes have *events*: e.g. a rustling in a tree → the traveler takes his binoculars → a cinematic
    close-up of a cardinal plays. Animals are not always visible; they walk/fly in and leave.
  - Characters must be integrated into the scene (lighting, shadows, scale, perspective), e.g. at the
    lake he must look like he is really there.
- Production pipeline to follow (from the user's art-direction prompt):
  1. One explicit view + one fixed light source per scene; consistent pixel density (no mixels).
  2. Background first with Create Image Pro, prompt includes "no characters".
  3. Inpaint the character into the background at its spawn area (Inpaint Pro / v3), output to its own
     layer, remove background to isolate it, add a dedicated ground-shadow layer.
  4. Seamless idle loops: interpolate with identical first and last frame (8-16 frames, subtle motion).
  5. Animate environmental regions in isolation (water, fire, lamp glow): mask the region, animate,
     freeze every other pixel to avoid background flicker.
  6. Quantize every animation to the scene palette (~30 colours) to stop frame-to-frame colour shift;
     max 3 shades per material, warm highlights / cool shadows, consistent outline rules,
     pixel-correct stray pixels.
  7. Final composition as layers: Background, Environment animations, Ground shadows, Characters.

## Added requests (latest session)
- A little **chapel** in the valley where the traveler goes to pray — create it with PixelLab
  (chapel interior idle scene: background via Create Image Pro with "no characters", wooden pews,
  altar with candles and an open Bible, wooden cross, arched window with snowfall; plus a top-down
  chapel map object with a small bell tower, placed on the big map and connected by a path).
  A calm prayer idle loop for the traveler (Waffles resting by the pews), integrated per the pipeline above.
- A small **wooden cross on the wall and a Bible** (e.g. on the side table) in the traveler's cabin.

## Status at end of session
- The planning workflow (production bible / asset manifest / implementation plan) did NOT run:
  all agents hit the usage limit. Re-run it next session (script idea: research PixelLab pipeline
  with small experiments + codebase map + UI/Settings spec + per-scene film scripts incl. the chapel,
  then synthesize docs/PRODUCTION_BIBLE.md, docs/asset_manifest.json, docs/IMPLEMENTATION_PLAN.md
  and critique them).
- Chapel / cross / Bible assets were not generated yet.
- PixelLab: ~1,912 generations left this cycle (Tier 1, 8 concurrent jobs, resets 2026-11-13).
- Local test: `npx http-server -p 8123 .` then `NODE_PATH=$(npm root -g) node tools/screenshots.cjs`.
