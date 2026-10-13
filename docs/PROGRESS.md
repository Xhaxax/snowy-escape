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
