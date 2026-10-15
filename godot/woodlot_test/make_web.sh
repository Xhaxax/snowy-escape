#!/bin/sh
# Export the Godot web build and pack it for the claude.ai artifact: the 38 MB engine is gzipped
# (about 9 MB, under the artifact's 15 MB file limit) and web/index.html unpacks it while loading;
# both binaries carry a .wasm name because artifacts only serve standard web file types.
set -e
cd "$(dirname "$0")"
GODOT=${GODOT:-godot}
mkdir -p build web
"$GODOT" --headless --path . --export-release "Web" build/index.html
gzip -9 -c build/index.wasm > web/engine-gz.wasm
cp build/index.pck web/game-pck.wasm
cp build/index.js build/index.audio.worklet.js build/index.audio.position.worklet.js web/
