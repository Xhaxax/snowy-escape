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
