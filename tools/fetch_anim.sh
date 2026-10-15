#!/usr/bin/env bash
# Download every frame of a PixelLab animate_image job and pack it into a sprite strip.
# usage: tools/fetch_anim.sh JOB_ID NAME FPS [--skip-first]
set -euo pipefail
job=$1; name=$2; fps=$3; skip=${4:-}
dir=$(mktemp -d)
i=0
while curl -sSL --fail -o "$dir/f$(printf %02d $i).png" "https://api.pixellab.ai/mcp/images/$job/download?index=$i" 2>/dev/null; do i=$((i+1)); done
rm -f "$dir/f$(printf %02d $i).png"
files=("$dir"/f*.png)
[ "$skip" = "--skip-first" ] && files=("${files[@]:1}")
python3 "$(dirname "$0")/strip.py" "$name" "$fps" "${files[@]}"
rm -rf "$dir"
