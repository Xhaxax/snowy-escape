# The woodlot, rebuilt in Godot 4.5 to try its lighting and weather:
#  - night is a CanvasModulate tint; the ground lantern and the woodshed lantern are PointLight2Ds
#    that light the normal-mapped backdrop (logs, trunks and drifts catch the light on their edges),
#    the traveler, Waffles and every snowflake that drifts through their glow
#  - a soft moonlight (DirectionalLight2D) gives the snow relief at night
#  - additive halos on their own canvas layer stand in for bloom (the web renderer has no 2D glow)
#  - snow is GPU particles in two depths with turbulence; the wind (with gusts) pushes the flakes,
#    bends the pines (shader), blows drifting snow along the ground and shakes the flames
#  - buttons switch the time of day and the weather so it can be compared with the browser game
extends Node2D

const W := 480
const H := 272
const MAN := Vector2(150, 104)       # chop_big (128x128) is painted over this corner of the backdrop
const LANTERN := Vector2(204, 224)   # the lantern set down in the snow by the chopping block (its flame)
const SHED := Vector2(281, 135)      # the lantern hanging on the woodshed
const DOG := Vector2(240, 231)       # Waffles lying in the snow (top-left of his 64x31 frame)
const CHIPS_AT := Vector2(176, 199)  # where the axe meets the log

const TIMES := {
	"day": {"tint": Color(1, 1, 1), "lamp": 0.0, "moon": 0.0},
	"dusk": {"tint": Color(0.78, 0.62, 0.72), "lamp": 0.65, "moon": 0.0},
	"night": {"tint": Color(0.2, 0.24, 0.42), "lamp": 1.0, "moon": 0.32},
}
const WEATHERS := {
	"calm": {"far": 0.35, "near": 0.2, "wind": 6.0, "gust": 0.2, "drift": 0.0, "fog": 0.0},
	"snowy": {"far": 0.75, "near": 0.5, "wind": 12.0, "gust": 0.3, "drift": 0.0, "fog": 0.04},
	"windy": {"far": 0.7, "near": 0.55, "wind": 48.0, "gust": 1.0, "drift": 0.7, "fog": 0.1},
	"storm": {"far": 1.0, "near": 1.0, "wind": 90.0, "gust": 1.0, "drift": 1.0, "fog": 0.38},
}

var time_of_day := "night"
var weather := "snowy"
var cur := {}          # the weather values easing toward the chosen weather
var lamp := 1.0        # 0..1, how lit the lanterns are (eases with the time of day)
var moon_k := 0.32
var wind := 0.0        # px/s pushing the snow (+ = to the right), gusts included
var noise := FastNoiseLite.new()

var tint: CanvasModulate
var bg_mat: ShaderMaterial
var man: AnimatedSprite2D
var dog: AnimatedSprite2D
var lantern_sprite: Sprite2D
var lantern_light: PointLight2D
var shed_light: PointLight2D
var moon: DirectionalLight2D
var halo_lantern: Sprite2D
var halo_shed: Sprite2D
var pool: Sprite2D
var snow_far: GPUParticles2D
var snow_near: GPUParticles2D
var drift: GPUParticles2D
var chips: CPUParticles2D
var fog: ColorRect
var wind_player: AudioStreamPlayer
var chop_player: AudioStreamPlayer
var chop_wait := 2.5
var chopping := false


func _ready() -> void:
	noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	noise.frequency = 0.08
	cur = WEATHERS[weather].duplicate()

	tint = CanvasModulate.new()
	add_child(tint)

	# the backdrop: colour + normal map, with the pines bending in the wind
	var bg := Sprite2D.new()
	var ct := CanvasTexture.new()
	ct.diffuse_texture = load("res://assets/bg_woodlot.png")
	ct.normal_texture = load("res://assets/bg_woodlot_n.png")
	bg.texture = ct
	bg.centered = false
	bg_mat = ShaderMaterial.new()
	bg_mat.shader = load("res://sway.gdshader")
	bg.material = bg_mat
	add_child(bg)

	snow_far = make_snow(800, 1.0, 22.0, 0.5)
	snow_far.z_index = 1
	add_child(snow_far)

	# the warm pool the lantern throws on the snow (lit, so it only shows where it is dark)
	pool = Sprite2D.new()
	pool.texture = radial(128)
	pool.position = LANTERN + Vector2(0, 11)
	pool.scale = Vector2(1.1, 0.34)
	pool.modulate = Color(1.0, 0.72, 0.42, 0.0)
	var add := CanvasItemMaterial.new()
	add.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	add.light_mode = CanvasItemMaterial.LIGHT_MODE_UNSHADED
	pool.material = add
	pool.z_index = 2
	add_child(pool)

	dog = AnimatedSprite2D.new()
	dog.sprite_frames = strip_frames("res://assets/dog_rest.png", 9, 64, 4.0)
	dog.centered = false
	dog.position = DOG
	dog.flip_h = true
	dog.z_index = 3
	add_child(dog)

	man = AnimatedSprite2D.new()
	man.sprite_frames = strip_frames("res://assets/chop_big.png", 14, 128, 11.0)
	man.sprite_frames.set_animation_loop("default", false)
	man.centered = false
	man.position = MAN
	man.z_index = 3
	man.frame_changed.connect(_on_chop_frame)
	man.animation_finished.connect(_on_chop_done)
	add_child(man)

	lantern_sprite = Sprite2D.new()
	lantern_sprite.texture = load("res://assets/lantern.png")
	lantern_sprite.centered = false
	lantern_sprite.position = LANTERN - Vector2(10, 18)
	lantern_sprite.z_index = 4
	add_child(lantern_sprite)

	chips = CPUParticles2D.new()
	chips.position = CHIPS_AT
	chips.emitting = false
	chips.one_shot = true
	chips.explosiveness = 1.0
	chips.amount = 12
	chips.lifetime = 0.9
	chips.direction = Vector2(0, -1)
	chips.spread = 70.0
	chips.initial_velocity_min = 40.0
	chips.initial_velocity_max = 90.0
	chips.gravity = Vector2(0, 260)
	chips.scale_amount_min = 1.0
	chips.scale_amount_max = 2.0
	chips.color = Color(0.86, 0.66, 0.42)
	chips.texture = pixel_tex()
	chips.z_index = 5
	add_child(chips)

	lantern_light = make_light(LANTERN, 256, 1.35, Color(1.0, 0.66, 0.36), 1.6)
	shed_light = make_light(SHED, 256, 0.8, Color(1.0, 0.7, 0.4), 1.2)
	moon = DirectionalLight2D.new()
	moon.color = Color(0.6, 0.7, 1.0)
	moon.height = 0.55
	moon.rotation_degrees = 35.0
	moon.blend_mode = Light2D.BLEND_MODE_ADD
	add_child(moon)

	snow_near = make_snow(320, 1.5, 34.0, 0.85)
	snow_near.z_index = 6
	add_child(snow_near)

	drift = make_drift()
	drift.z_index = 6
	add_child(drift)

	fog = ColorRect.new()
	fog.size = Vector2(W, H)
	fog.color = Color(3.2, 3.3, 3.6, 0.0)
	fog.mouse_filter = Control.MOUSE_FILTER_IGNORE
	fog.z_index = 7
	add_child(fog)

	# bloom stand-ins: soft additive halos on a layer the night tint doesn't darken
	var glow := CanvasLayer.new()
	glow.layer = 1
	add_child(glow)
	halo_lantern = make_halo(LANTERN, 0.75)
	halo_shed = make_halo(SHED, 0.45)
	glow.add_child(halo_lantern)
	glow.add_child(halo_shed)

	wind_player = AudioStreamPlayer.new()
	var ws: AudioStreamMP3 = load("res://assets/amb_wind.mp3")
	ws.loop = true
	wind_player.stream = ws
	wind_player.volume_db = -14.0
	wind_player.autoplay = true
	add_child(wind_player)
	chop_player = AudioStreamPlayer.new()
	chop_player.stream = load("res://assets/sfx_chop.mp3")
	chop_player.volume_db = -6.0
	add_child(chop_player)

	build_ui()
	set_time(time_of_day, true)


func _process(dt: float) -> void:
	var tgt: Dictionary = WEATHERS[weather]
	for k in cur.keys():
		cur[k] = lerpf(cur[k], tgt[k], 1.0 - exp(-dt * 0.8))
	var tod: Dictionary = TIMES[time_of_day]
	lamp = lerpf(lamp, tod["lamp"], 1.0 - exp(-dt * 1.5))
	moon_k = lerpf(moon_k, tod["moon"], 1.0 - exp(-dt * 1.5))
	tint.color = tint.color.lerp(tod["tint"], 1.0 - exp(-dt * 1.5))

	# the wind: a steady push that breathes, with gusts on top in windy weather
	var t := Time.get_ticks_msec() / 1000.0
	var breathe := 0.75 + 0.25 * noise.get_noise_1d(t * 3.0)
	var gust: float = maxf(0.0, noise.get_noise_1d(t * 1.4 + 100.0)) * 2.2 * float(cur["gust"])
	wind = float(cur["wind"]) * (breathe + gust)
	var force := clampf(wind / 70.0, 0.0, 1.0)
	bg_mat.set_shader_parameter("wind", force)

	for p in [snow_far, snow_near]:
		var m: ParticleProcessMaterial = p.process_material
		var depth := 0.6 if p == snow_far else 1.0
		m.gravity = Vector3(wind * depth, m.gravity.y, 0)
		p.position.x = W / 2.0 - wind * 2.2 * depth   # feed the flakes in from upwind
	snow_far.amount_ratio = cur["far"]
	snow_near.amount_ratio = cur["near"]
	drift.amount_ratio = clampf(cur["drift"] * (0.4 + force), 0.0, 1.0)
	(drift.process_material as ParticleProcessMaterial).initial_velocity_min = wind * 1.2
	(drift.process_material as ParticleProcessMaterial).initial_velocity_max = wind * 1.9
	fog.color.a = cur["fog"]

	# flames: a steady little flicker, shaken harder by the wind
	var fl := 0.92 + 0.05 * sin(t * 7.3) + 0.04 * noise.get_noise_1d(t * 9.0) - 0.08 * force * absf(noise.get_noise_1d(t * 6.0))
	lantern_light.energy = 1.6 * lamp * fl
	shed_light.energy = 1.2 * lamp * (fl + 0.03 * sin(t * 5.1))
	moon.energy = moon_k
	lantern_sprite.modulate.a = clampf(lamp * 1.4, 0.0, 1.0)
	lantern_sprite.visible = lamp > 0.05
	halo_lantern.modulate.a = 0.55 * lamp * fl
	halo_shed.modulate.a = 0.45 * lamp * fl
	pool.modulate.a = 0.3 * lamp * fl
	wind_player.volume_db = linear_to_db(0.08 + 0.55 * force)

	# Waffles: slow breathing with his head down, then a look up now and then
	var c := fmod(t, 14.0)
	dog.frame = (int(c * 0.8) % 2) if c < 9.0 else mini(8, 2 + int((c - 9.0) * 1.6))

	# a swing every few seconds
	chop_wait -= dt
	if chop_wait <= 0.0 and not chopping:
		chopping = true
		chop_wait = randf_range(3.5, 6.0)
		man.frame = 0
		man.play("default")


func _on_chop_done() -> void:
	chopping = false
	man.frame = 0


func _on_chop_frame() -> void:
	if chopping and man.frame == 4:
		chop_player.pitch_scale = randf_range(0.92, 1.06)
		chop_player.play()
		chips.restart()


func set_time(which: String, instant := false) -> void:
	time_of_day = which
	if instant:
		var tod: Dictionary = TIMES[which]
		tint.color = tod["tint"]
		lamp = tod["lamp"]
		moon_k = tod["moon"]


func set_weather(which: String) -> void:
	weather = which


# ---------------------------------------------------------------- building blocks

func radial(size: int) -> GradientTexture2D:
	var g := Gradient.new()
	g.set_color(0, Color(1, 1, 1, 1))
	g.set_color(1, Color(1, 1, 1, 0))
	g.add_point(0.3, Color(1, 1, 1, 0.6))
	var tex := GradientTexture2D.new()
	tex.gradient = g
	tex.fill = GradientTexture2D.FILL_RADIAL
	tex.fill_from = Vector2(0.5, 0.5)
	tex.fill_to = Vector2(1.0, 0.5)
	tex.width = size
	tex.height = size
	return tex


func pixel_tex() -> ImageTexture:
	var img := Image.create(1, 1, false, Image.FORMAT_RGBA8)
	img.fill(Color.WHITE)
	return ImageTexture.create_from_image(img)


func make_light(pos: Vector2, size: int, scale_k: float, col: Color, energy: float) -> PointLight2D:
	var l := PointLight2D.new()
	l.texture = radial(size)
	l.texture_scale = scale_k
	l.position = pos
	l.color = col
	l.energy = energy
	l.height = 70.0   # high enough to reach the flat snow, low enough that edges still catch it
	l.blend_mode = Light2D.BLEND_MODE_ADD
	add_child(l)
	return l


func make_halo(pos: Vector2, size_k: float) -> Sprite2D:
	var s := Sprite2D.new()
	s.texture = radial(64)
	s.position = pos
	s.scale = Vector2(size_k, size_k)
	s.modulate = Color(1.0, 0.78, 0.5, 0.5)
	var m := CanvasItemMaterial.new()
	m.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	s.material = m
	return s


func make_snow(amount: int, size: float, speed: float, alpha: float) -> GPUParticles2D:
	var p := GPUParticles2D.new()
	p.amount = amount
	p.lifetime = 10.0
	p.preprocess = 10.0
	p.texture = pixel_tex()
	p.position = Vector2(W / 2.0, -6)
	p.visibility_rect = Rect2(-500, -50, 1000, 400)
	var m := ParticleProcessMaterial.new()
	m.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_BOX
	m.emission_box_extents = Vector3(W * 1.1, 2, 0)
	m.direction = Vector3(0, 1, 0)
	m.spread = 12.0
	m.initial_velocity_min = speed * 0.6
	m.initial_velocity_max = speed
	m.gravity = Vector3(0, speed * 0.25, 0)
	m.turbulence_enabled = true
	m.turbulence_noise_strength = 2.5
	m.turbulence_noise_scale = 3.0
	m.turbulence_influence_min = 0.04
	m.turbulence_influence_max = 0.14
	m.scale_min = size
	m.scale_max = size * 2.0
	m.color = Color(2.6, 2.6, 2.8, alpha)
	p.process_material = m
	return p


func make_drift() -> GPUParticles2D:
	var p := GPUParticles2D.new()
	p.amount = 700
	p.lifetime = 3.0
	p.texture = pixel_tex()
	p.position = Vector2(-60, 236)
	p.visibility_rect = Rect2(-100, -80, 700, 160)
	p.amount_ratio = 0.0
	var m := ParticleProcessMaterial.new()
	m.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_BOX
	m.emission_box_extents = Vector3(80, 34, 0)
	m.direction = Vector3(1, -0.08, 0)
	m.scale_min = 1.0
	m.scale_max = 2.0
	m.spread = 6.0
	m.initial_velocity_min = 40.0
	m.initial_velocity_max = 80.0
	m.gravity = Vector3(0, 6, 0)
	m.turbulence_enabled = true
	m.turbulence_noise_strength = 4.0
	m.turbulence_influence_min = 0.1
	m.turbulence_influence_max = 0.25
	m.color = Color(3.6, 3.7, 4.0, 0.55)
	p.process_material = m
	return p


func strip_frames(path: String, count: int, fw: int, fps: float) -> SpriteFrames:
	var tex: Texture2D = load(path)
	var sf := SpriteFrames.new()
	sf.set_animation_speed("default", fps)
	for i in count:
		var at := AtlasTexture.new()
		at.atlas = tex
		at.region = Rect2(i * fw, 0, fw, tex.get_height())
		sf.add_frame("default", at)
	return sf


func build_ui() -> void:
	var ui := CanvasLayer.new()
	ui.layer = 2
	add_child(ui)
	var theme := Theme.new()
	var font: FontFile = load("res://assets/PixelifySans.ttf")
	font.antialiasing = TextServer.FONT_ANTIALIASING_NONE
	theme.default_font = font
	theme.default_font_size = 8
	var box := VBoxContainer.new()
	box.theme = theme
	box.position = Vector2(6, 4)
	box.add_theme_constant_override("separation", 2)
	ui.add_child(box)
	box.add_child(button_row(["day", "dusk", "night"], time_of_day, func(n): set_time(n)))
	box.add_child(button_row(["calm", "snowy", "windy", "storm"], weather, func(n): set_weather(n)))
	var note := Label.new()
	note.theme = theme
	note.text = "Godot 4.5 test - woodlot: lights, wind, snow"
	note.position = Vector2(6, H - 13)
	note.modulate = Color(1, 0.92, 0.78, 0.8)
	ui.add_child(note)


func button_row(names: Array, active: String, cb: Callable) -> HBoxContainer:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 2)
	var group := ButtonGroup.new()
	for n in names:
		var b := Button.new()
		b.text = n
		b.toggle_mode = true
		b.button_group = group
		b.button_pressed = n == active
		b.focus_mode = Control.FOCUS_NONE
		b.custom_minimum_size = Vector2(34, 13)
		b.pressed.connect(func(): cb.call(n))
		row.add_child(b)
	return row
