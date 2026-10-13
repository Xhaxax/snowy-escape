# Snowy Escape

A cozy pixel-art idle game to keep open while you study or work. You're a lonely traveler with a log cabin in the mountains, a fluffy Bernese mountain dog called **Waffles** and a cat called **Mochi**. Nothing is urgent. Every activity has a small optional minigame, and **Just watch** mode lets each scene play itself on a loop.

All art (backgrounds, characters, animations) was made with [PixelLab](https://pixellab.ai). Music and sound effects are synthesized live in the browser.

## Play

Open `index.html` in a browser. Or serve the folder so optional mp3 overrides can load:

```sh
npx http-server -p 8123 .
# then open http://localhost:8123
```

Progress saves automatically in your browser (localStorage).

## The valley

| Place | Idle screen | Optional activity |
| --- | --- | --- |
| **The Cabin** | Fire crackling, snow outside, Waffles by the fire, Mochi on the windowsill | Sit on the couch with a hot chocolate and Mochi on your lap, add logs to the fire, pet Waffles or Mochi (close-ups) |
| **Kitchen** | Oven ticking, Mochi sitting on the counter | Make hot chocolate (pour → scoop → stir → marshmallows); cook your catch (chop → season → fry → plate) while Mochi tries to steal a bite |
| **Porch & Yard** | Chimney smoke, glowing windows | Chop firewood (Waffles cheers or naps), shovel snow off the path, rock in the rocking chair on the porch |
| **Frozen Lake** | Ice fishing, bobber bobbing | Reel in: keep the fish inside the green zone |
| **Whispering Pines** | Deer wander in and graze | Sketch a deer while it looks up (polaroid for the journal) |
| **Summit Trail** | Above the clouds | Guided breathing; wish on shooting stars at dusk/night |

To get anywhere outside the cabin you walk there with Waffles: crunchy footsteps, footprints in the snow, little thoughts along the way.

## A gentle loop

- **Time passes.** One real minute is one in-game hour, so a full day/night cycle takes 24 minutes. You can switch to your real clock or fix the time of day under the snowflake button.
- **Snow never stops.** Some hours it barely falls, some it piles up; the wind rises and calms, the sun breaks through, and now and then a **snowstorm** closes the trails. If it catches you outside, you and Waffles walk home.
- **Snow piles up on the path.** Shovel it now and then; if it gets really deep you need to clear it before you can wander off.
- **The fire and the oven burn down slowly.** Chop wood in the yard, add logs to the fireplace and the oven. A warm oven is needed to cook and to make cocoa.
- **Fish → kitchen → dinner.** Catch fish at the lake, cook them at home, share a bite with Waffles and Mochi.

Nothing can fail or be lost. Finishing something plays a little jingle and gives you some well-earned props.

## Buttons (top right)

- **Just watch:** every scene plays its own loop. The traveler fishes, cooks, chops wood, pets Waffles, sips cocoa and sketches deer by himself.
- **Journal:** fish caught, dishes cooked, moments collected.
- **Focus timer:** pomodoro-style 25/5, 50/10 or 90/15.
- **Weather & time:** let nature decide, or pick a weather and time of day.
- **Sound:** music, ambience and effect volumes.
- **Fade UI:** the interface fades away when you stop moving the mouse.
- **Fullscreen.**

## Project layout

```
index.html            entry point (no build step)
src/engine.js         canvas scaling, loop, input, assets, UI helpers, save, celebrations
src/audio.js          generative lofi music, layered ambience, synthesized sound effects
src/weather.js        snowfall, wind, sun, storms, day/night clock, snow depth, fire/oven
src/hud.js            top bar, journal, focus timer, sound & weather panels
src/actors.js         shared drawing helpers, petting close-up, fish sprite tinting
src/scenes/*.js       title, map, travel, cabin, kitchen, yard, lake, forest, summit
src/manifest.js       sprite-strip registry (generated)
assets/img/           PixelLab backgrounds and sprite strips
tools/strip.py        packs PixelLab animation frames into strips + manifest
tools/screenshots.cjs Playwright smoke test that tours every scene
```

### Swapping in recorded audio

Drop mp3 files into `assets/audio/` and they replace the synthesized versions when the game is served over http: `music_cabin.mp3`, `music_outdoors.mp3`, `sfx_step1-3.mp3`, `sfx_splash.mp3`, `sfx_chop.mp3`, `sfx_purr.mp3`, `sfx_woof.mp3` and the rest listed in `src/audio.js`.
