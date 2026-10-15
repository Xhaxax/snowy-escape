// The woodlot backdrop: the two stands of pines at the edges of the clearing bend in the wind,
// pixel by pixel (whole-pixel row shifts, stronger toward the tops), and the normal map follows
// the same shift so the lantern light stays on the right needles.
shader_type canvas_item;

uniform float wind = 0.0;                         // 0..1, from the weather
uniform vec2 tex_size = vec2(480.0, 272.0);
uniform vec4 left_trees = vec4(0.0, 110.0, 0.0, 190.0);   // x0, x1, y0, y1 in pixels
uniform vec4 right_trees = vec4(380.0, 480.0, 0.0, 190.0);

float sway(vec2 px, vec4 r, float t) {
	if (px.x < r.x || px.x >= r.y || px.y < r.z || px.y >= r.w) return 0.0;
	float k = pow(1.0 - (px.y - r.z) / (r.w - r.z), 1.6);
	float amp = min(3.0, wind * 3.4);
	return floor(amp * k * sin(t * (1.1 + wind * 0.9) + r.x * 0.05 + px.y * 0.012) + 0.5);
}

void fragment() {
	vec2 px = floor(UV * tex_size);
	float off = sway(px, left_trees, TIME) + sway(px, right_trees, TIME);
	vec2 uv = (px - vec2(off, 0.0) + 0.5) / tex_size;
	COLOR = texture(TEXTURE, uv);
	NORMAL_MAP = texture(NORMAL_TEXTURE, uv).rgb;
}
