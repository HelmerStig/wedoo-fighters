extends RefCounted

## Costruisce gli SpriteFrames runtime di Arianna senza mescolare slicing e gameplay.

var fighter: Node
var animated_sprite: AnimatedSprite2D


func _init(owner: Node) -> void:
	fighter = owner
	animated_sprite = owner.get_node("AnimatedSprite2D") as AnimatedSprite2D


func configure_all() -> void:
	configure_idle_frames()
	configure_walk_frames()
	configure_backwalk_frames()
	configure_run_frames()
	configure_back_jump_frames()
	configure_crouch_frames()
	configure_block_high_frames()
	configure_block_mid_frames()
	configure_block_low_frames()
	configure_light_punch_frames()
	configure_lp_mp_combo_frames()
	configure_low_light_punch_frames()
	configure_medium_punch_frames()
	configure_low_medium_punch_frames()
	configure_strong_punch_frames()
	configure_crouched_strong_punch_frames()
	configure_light_kick_frames()
	configure_low_light_kick_frames()
	configure_medium_kick_frames()
	configure_low_medium_kick_frames()
	configure_strong_kick_frames()
	configure_low_strong_kick_frames()
	configure_jump_frames()
	configure_jump_light_punch_frames()
	configure_jump_medium_punch_frames()
	configure_jump_strong_punch_frames()
	configure_jump_light_kick_frames()
	configure_jump_medium_kick_frames()
	configure_jump_strong_kick_frames()
	configure_baseball_special_frames()
	configure_points_forward_super_frames()
	configure_whistle_special_frames()
	configure_hurt_medium_frames()
	configure_hurt_high_frames()
	configure_hurt_low_frames()
	configure_hurted_in_jump_frames()
	configure_sweep_knockdown_frames()
	configure_knockdown_recovery_frames()
	configure_ko_frames()
	configure_victory_frames()


func configure_idle_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"idle"):
		frames.remove_animation(&"idle")
	frames.add_animation(&"idle")
	frames.set_animation_speed(&"idle", 24.0)
	frames.set_animation_loop(&"idle", true)
	for source_index in range(fighter.ARIANNA_IDLE_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.ARIANNA_IDLE_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.ARIANNA_IDLE_COLUMNS),
				float(floori(float(source_index) / fighter.ARIANNA_IDLE_COLUMNS))
			) * fighter.ARIANNA_IDLE_CELL_SIZE,
			fighter.ARIANNA_IDLE_CELL_SIZE
		)
		frames.add_frame(&"idle", atlas_frame)


func configure_walk_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"walk"):
		frames.remove_animation(&"walk")
	frames.add_animation(&"walk")
	frames.set_animation_speed(&"walk", 24.0)
	frames.set_animation_loop(&"walk", true)
	for source_index in range(fighter.ARIANNA_WALK_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.ARIANNA_WALK_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.ARIANNA_WALK_COLUMNS),
				float(floori(float(source_index) / fighter.ARIANNA_WALK_COLUMNS))
			) * fighter.ARIANNA_WALK_CELL_SIZE,
			fighter.ARIANNA_WALK_CELL_SIZE
		)
		frames.add_frame(&"walk", atlas_frame)


func configure_backwalk_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"backwalk"):
		frames.remove_animation(&"backwalk")
	frames.add_animation(&"backwalk")
	frames.set_animation_speed(&"backwalk", 24.0)
	frames.set_animation_loop(&"backwalk", true)
	for source_index in range(fighter.ARIANNA_WALK_FRAME_COUNT - 1, -1, -1):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.ARIANNA_WALK_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.ARIANNA_WALK_COLUMNS),
				float(floori(float(source_index) / fighter.ARIANNA_WALK_COLUMNS))
			) * fighter.ARIANNA_WALK_CELL_SIZE,
			fighter.ARIANNA_WALK_CELL_SIZE
		)
		frames.add_frame(&"backwalk", atlas_frame)


func configure_run_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"run"):
		frames.remove_animation(&"run")
	frames.add_animation(&"run")
	frames.set_animation_speed(&"run", 24.0)
	frames.set_animation_loop(&"run", true)
	for source_index in range(fighter.ARIANNA_RUN_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.ARIANNA_RUN_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.ARIANNA_RUN_COLUMNS),
				float(floori(float(source_index) / fighter.ARIANNA_RUN_COLUMNS))
			) * fighter.ARIANNA_RUN_CELL_SIZE,
			fighter.ARIANNA_RUN_CELL_SIZE
		)
		frames.add_frame(&"run", atlas_frame)


func configure_back_jump_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"arianna_back_jump"):
		frames.remove_animation(&"arianna_back_jump")
	frames.add_animation(&"arianna_back_jump")
	frames.set_animation_speed(&"arianna_back_jump", 48.0)
	frames.set_animation_loop(&"arianna_back_jump", false)
	for source_index in range(
		fighter.ARIANNA_BACK_JUMP_SOURCE_START,
		fighter.ARIANNA_BACK_JUMP_SOURCE_END + 1
	):
		frames.add_frame(&"arianna_back_jump", _make_back_jump_frame(source_index))


func _make_back_jump_frame(frame_index: int) -> AtlasTexture:
	var atlas_frame := AtlasTexture.new()
	atlas_frame.atlas = fighter.ARIANNA_BACK_JUMP_SHEET
	atlas_frame.region = Rect2(
		Vector2(
			float(frame_index % fighter.ARIANNA_BACK_JUMP_COLUMNS),
			float(frame_index / fighter.ARIANNA_BACK_JUMP_COLUMNS)
		) * fighter.ARIANNA_BACK_JUMP_CELL_SIZE,
		fighter.ARIANNA_BACK_JUMP_CELL_SIZE
	)
	return atlas_frame


func configure_crouch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	for animation_name in [&"crouch", &"arianna_crouch_recovery"]:
		if frames.has_animation(animation_name):
			frames.remove_animation(animation_name)
		frames.add_animation(animation_name)
		frames.set_animation_speed(animation_name, 48.0)
		frames.set_animation_loop(animation_name, false)
	for source_index in range(fighter.ARIANNA_CROUCH_FRAME_COUNT):
		frames.add_frame(&"crouch", _make_crouch_frame(source_index))
	for source_index in range(fighter.ARIANNA_CROUCH_FRAME_COUNT - 2, -1, -1):
		frames.add_frame(&"arianna_crouch_recovery", _make_crouch_frame(source_index))


func configure_block_high_frames() -> void:
	var frames := animated_sprite.sprite_frames
	for animation_name in [&"block_high", &"block_high_recovery"]:
		if frames.has_animation(animation_name):
			frames.remove_animation(animation_name)
		frames.add_animation(animation_name)
		frames.set_animation_speed(animation_name, 48.0)
		frames.set_animation_loop(animation_name, false)
	for source_index in range(fighter.ARIANNA_GUARD_HIGH_FRAME_COUNT):
		frames.add_frame(&"block_high", _make_guard_high_frame(source_index))
	for source_index in range(fighter.ARIANNA_GUARD_HIGH_FRAME_COUNT - 2, -1, -1):
		frames.add_frame(&"block_high_recovery", _make_guard_high_frame(source_index))


func _make_guard_high_frame(source_index: int) -> AtlasTexture:
	var atlas_frame := AtlasTexture.new()
	atlas_frame.atlas = fighter.ARIANNA_GUARD_HIGH_SHEET
	atlas_frame.region = Rect2(
		Vector2(
			float(source_index % fighter.ARIANNA_GUARD_HIGH_COLUMNS),
			float(source_index / fighter.ARIANNA_GUARD_HIGH_COLUMNS)
		) * fighter.ARIANNA_GUARD_HIGH_CELL_SIZE,
		fighter.ARIANNA_GUARD_HIGH_CELL_SIZE
	)
	return atlas_frame


func configure_block_mid_frames() -> void:
	var frames := animated_sprite.sprite_frames
	for animation_name in [&"block_mid", &"block_mid_recovery"]:
		if frames.has_animation(animation_name):
			frames.remove_animation(animation_name)
		frames.add_animation(animation_name)
		frames.set_animation_speed(animation_name, 48.0)
		frames.set_animation_loop(animation_name, false)
	for source_index in range(fighter.ARIANNA_GUARD_MIDDLE_FRAME_COUNT):
		frames.add_frame(&"block_mid", _make_guard_middle_frame(source_index))
	for source_index in range(fighter.ARIANNA_GUARD_MIDDLE_FRAME_COUNT - 2, -1, -1):
		frames.add_frame(&"block_mid_recovery", _make_guard_middle_frame(source_index))


func _make_guard_middle_frame(source_index: int) -> AtlasTexture:
	var atlas_frame := AtlasTexture.new()
	atlas_frame.atlas = fighter.ARIANNA_GUARD_MIDDLE_SHEET
	atlas_frame.region = Rect2(
		Vector2(
			float(source_index % fighter.ARIANNA_GUARD_MIDDLE_COLUMNS),
			float(source_index / fighter.ARIANNA_GUARD_MIDDLE_COLUMNS)
		) * fighter.ARIANNA_GUARD_MIDDLE_CELL_SIZE,
		fighter.ARIANNA_GUARD_MIDDLE_CELL_SIZE
	)
	return atlas_frame


func configure_block_low_frames() -> void:
	var frames := animated_sprite.sprite_frames
	for animation_name in [&"block_low", &"block_low_crouched", &"block_low_recovery"]:
		if frames.has_animation(animation_name):
			frames.remove_animation(animation_name)
		frames.add_animation(animation_name)
		frames.set_animation_speed(animation_name, 48.0)
		frames.set_animation_loop(animation_name, false)
	for source_index in range(fighter.ARIANNA_GUARD_LOW_FRAME_COUNT):
		for animation_name in [&"block_low", &"block_low_crouched"]:
			frames.add_frame(animation_name, _make_guard_low_frame(source_index))
	for source_index in range(fighter.ARIANNA_GUARD_LOW_FRAME_COUNT - 2, -1, -1):
		frames.add_frame(&"block_low_recovery", _make_guard_low_frame(source_index))


func _make_guard_low_frame(source_index: int) -> AtlasTexture:
	var atlas_frame := AtlasTexture.new()
	atlas_frame.atlas = fighter.ARIANNA_GUARD_LOW_SHEET
	atlas_frame.region = Rect2(
		Vector2(
			float(source_index % fighter.ARIANNA_GUARD_LOW_COLUMNS),
			float(source_index / fighter.ARIANNA_GUARD_LOW_COLUMNS)
		) * fighter.ARIANNA_GUARD_LOW_CELL_SIZE,
		fighter.ARIANNA_GUARD_LOW_CELL_SIZE
	)
	return atlas_frame


func _make_crouch_frame(source_index: int) -> AtlasTexture:
	var atlas_frame := AtlasTexture.new()
	atlas_frame.atlas = fighter.ARIANNA_CROUCH_SHEET
	atlas_frame.region = Rect2(
		Vector2(
			float(source_index % fighter.ARIANNA_CROUCH_COLUMNS),
			float(floori(float(source_index) / fighter.ARIANNA_CROUCH_COLUMNS))
		) * fighter.ARIANNA_CROUCH_CELL_SIZE,
		fighter.ARIANNA_CROUCH_CELL_SIZE
	)
	return atlas_frame


func configure_light_punch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	for animation_name in [&"arianna_light_punch", &"arianna_light_punch_recovery"]:
		if frames.has_animation(animation_name):
			frames.remove_animation(animation_name)
		frames.add_animation(animation_name)
		frames.set_animation_speed(animation_name, 48.0)
		frames.set_animation_loop(animation_name, false)
	for source_index in range(fighter.ARIANNA_LIGHT_PUNCH_LAST_PLAYED_FRAME):
		frames.add_frame(&"arianna_light_punch", _make_light_punch_frame(source_index))
	for source_index in range(fighter.ARIANNA_LIGHT_PUNCH_LAST_PLAYED_FRAME - 1, -1, -1):
		frames.add_frame(&"arianna_light_punch_recovery", _make_light_punch_frame(source_index))


func _make_light_punch_frame(source_index: int) -> AtlasTexture:
	var atlas_frame := AtlasTexture.new()
	atlas_frame.atlas = fighter.ARIANNA_LIGHT_PUNCH_SHEET
	atlas_frame.region = Rect2(
		Vector2(
			float(source_index % fighter.ARIANNA_LIGHT_PUNCH_COLUMNS),
			float(floori(float(source_index) / fighter.ARIANNA_LIGHT_PUNCH_COLUMNS))
		) * fighter.ARIANNA_LIGHT_PUNCH_CELL_SIZE,
		fighter.ARIANNA_LIGHT_PUNCH_CELL_SIZE
	)
	return atlas_frame


func configure_lp_mp_combo_frames() -> void:
	var frames := animated_sprite.sprite_frames
	var animation_names := [
		&"arianna_combo_lp",
		&"arianna_combo_lp_recovery",
		&"arianna_combo_mp",
		&"arianna_combo_mp_recovery",
		&"arianna_combo_mk",
		&"arianna_combo_mk_recovery",
	]
	for animation_name in animation_names:
		if frames.has_animation(animation_name):
			frames.remove_animation(animation_name)
		frames.add_animation(animation_name)
		frames.set_animation_speed(animation_name, 48.0)
		frames.set_animation_loop(animation_name, false)
	for source_index in range(0, 8):
		frames.add_frame(&"arianna_combo_lp", _make_light_punch_frame(source_index))
	for source_index in range(6, 3, -1):
		frames.add_frame(&"arianna_combo_lp_recovery", _make_light_punch_frame(source_index))
	for source_index in range(17, 25):
		frames.add_frame(&"arianna_combo_mp", _make_medium_punch_frame(source_index))
	for source_index in range(23, 16, -1):
		frames.add_frame(&"arianna_combo_mp_recovery", _make_medium_punch_frame(source_index))
	for source_index in range(15, 29):
		frames.add_frame(&"arianna_combo_mk", _make_medium_kick_frame(source_index))
	for source_index in range(27, -1, -1):
		frames.add_frame(&"arianna_combo_mk_recovery", _make_medium_kick_frame(source_index))


func configure_low_light_punch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	for animation_name in [&"arianna_low_light_punch", &"arianna_low_light_punch_recovery"]:
		if frames.has_animation(animation_name):
			frames.remove_animation(animation_name)
		frames.add_animation(animation_name)
		frames.set_animation_speed(animation_name, 48.0)
		frames.set_animation_loop(animation_name, false)
	for source_index in range(fighter.ARIANNA_LOW_LIGHT_PUNCH_LAST_PLAYED_FRAME):
		frames.add_frame(&"arianna_low_light_punch", _make_low_light_punch_frame(source_index))
	for source_index in range(fighter.ARIANNA_LOW_LIGHT_PUNCH_LAST_PLAYED_FRAME - 2, -1, -1):
		frames.add_frame(
			&"arianna_low_light_punch_recovery",
			_make_low_light_punch_frame(source_index)
		)


func _make_low_light_punch_frame(source_index: int) -> AtlasTexture:
	var atlas_frame := AtlasTexture.new()
	atlas_frame.atlas = fighter.ARIANNA_LOW_LIGHT_PUNCH_SHEET
	atlas_frame.region = Rect2(
		Vector2(
			float(source_index % fighter.ARIANNA_LOW_LIGHT_PUNCH_COLUMNS),
			float(source_index / fighter.ARIANNA_LOW_LIGHT_PUNCH_COLUMNS)
		) * fighter.ARIANNA_LOW_LIGHT_PUNCH_CELL_SIZE,
		fighter.ARIANNA_LOW_LIGHT_PUNCH_CELL_SIZE
	)
	return atlas_frame


func configure_medium_punch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	for animation_name in [&"arianna_medium_punch", &"arianna_medium_punch_recovery"]:
		if frames.has_animation(animation_name):
			frames.remove_animation(animation_name)
		frames.add_animation(animation_name)
		frames.set_animation_speed(animation_name, 48.0)
		frames.set_animation_loop(animation_name, false)
	for source_index in range(fighter.ARIANNA_MEDIUM_PUNCH_FRAME_COUNT):
		frames.add_frame(&"arianna_medium_punch", _make_medium_punch_frame(source_index))
	for source_index in range(fighter.ARIANNA_MEDIUM_PUNCH_FRAME_COUNT - 2, -1, -1):
		frames.add_frame(
			&"arianna_medium_punch_recovery",
			_make_medium_punch_frame(source_index)
		)


func _make_medium_punch_frame(source_index: int) -> AtlasTexture:
	var atlas_frame := AtlasTexture.new()
	atlas_frame.atlas = fighter.ARIANNA_MEDIUM_PUNCH_SHEET
	atlas_frame.region = Rect2(
		Vector2(
			float(source_index % fighter.ARIANNA_MEDIUM_PUNCH_COLUMNS),
			float(source_index / fighter.ARIANNA_MEDIUM_PUNCH_COLUMNS)
		) * fighter.ARIANNA_MEDIUM_PUNCH_CELL_SIZE,
		fighter.ARIANNA_MEDIUM_PUNCH_CELL_SIZE
	)
	return atlas_frame


func configure_low_medium_punch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	for animation_name in [&"arianna_low_medium_punch", &"arianna_low_medium_punch_recovery"]:
		if frames.has_animation(animation_name):
			frames.remove_animation(animation_name)
		frames.add_animation(animation_name)
		frames.set_animation_speed(animation_name, 24.0)
		frames.set_animation_loop(animation_name, false)
	for source_index in range(fighter.ARIANNA_LOW_MEDIUM_PUNCH_FRAME_COUNT):
		frames.add_frame(&"arianna_low_medium_punch", _make_low_medium_punch_frame(source_index))
	# Il ritorno parte dal fotogramma sorgente 11 e si ferma al 4.
	for source_index in range(fighter.ARIANNA_LOW_MEDIUM_PUNCH_FRAME_COUNT - 2, 2, -1):
		frames.add_frame(
			&"arianna_low_medium_punch_recovery",
			_make_low_medium_punch_frame(source_index)
		)


func _make_low_medium_punch_frame(source_index: int) -> AtlasTexture:
	var atlas_frame := AtlasTexture.new()
	atlas_frame.atlas = fighter.ARIANNA_LOW_MEDIUM_PUNCH_SHEET
	atlas_frame.region = Rect2(
		Vector2(
			float(source_index % fighter.ARIANNA_LOW_MEDIUM_PUNCH_COLUMNS),
			float(source_index / fighter.ARIANNA_LOW_MEDIUM_PUNCH_COLUMNS)
		) * fighter.ARIANNA_LOW_MEDIUM_PUNCH_CELL_SIZE,
		fighter.ARIANNA_LOW_MEDIUM_PUNCH_CELL_SIZE
	)
	return atlas_frame


func configure_strong_punch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"arianna_strong_punch"):
		frames.remove_animation(&"arianna_strong_punch")
	frames.add_animation(&"arianna_strong_punch")
	frames.set_animation_speed(&"arianna_strong_punch", 48.0)
	frames.set_animation_loop(&"arianna_strong_punch", false)
	for source_index in range(fighter.ARIANNA_STRONG_PUNCH_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.ARIANNA_STRONG_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.ARIANNA_STRONG_PUNCH_COLUMNS),
				float(source_index / fighter.ARIANNA_STRONG_PUNCH_COLUMNS)
			) * fighter.ARIANNA_STRONG_PUNCH_CELL_SIZE,
			fighter.ARIANNA_STRONG_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"arianna_strong_punch", atlas_frame)


func configure_crouched_strong_punch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"arianna_crouched_strong_punch"):
		frames.remove_animation(&"arianna_crouched_strong_punch")
	frames.add_animation(&"arianna_crouched_strong_punch")
	frames.set_animation_speed(&"arianna_crouched_strong_punch", 48.0)
	frames.set_animation_loop(&"arianna_crouched_strong_punch", false)
	for source_index in range(fighter.ARIANNA_CROUCHED_STRONG_PUNCH_SOURCE_FRAME_COUNT):
		if (
			source_index >= fighter.ARIANNA_CROUCHED_STRONG_PUNCH_SKIP_START
			and source_index <= fighter.ARIANNA_CROUCHED_STRONG_PUNCH_SKIP_END
		):
			continue
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.ARIANNA_CROUCHED_STRONG_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.ARIANNA_CROUCHED_STRONG_PUNCH_COLUMNS),
				float(source_index / fighter.ARIANNA_CROUCHED_STRONG_PUNCH_COLUMNS)
			) * fighter.ARIANNA_CROUCHED_STRONG_PUNCH_CELL_SIZE,
			fighter.ARIANNA_CROUCHED_STRONG_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"arianna_crouched_strong_punch", atlas_frame)


func configure_light_kick_frames() -> void:
	var frames := animated_sprite.sprite_frames
	for animation_name in [&"arianna_light_kick", &"arianna_light_kick_recovery"]:
		if frames.has_animation(animation_name):
			frames.remove_animation(animation_name)
		frames.add_animation(animation_name)
		frames.set_animation_speed(animation_name, 48.0)
		frames.set_animation_loop(animation_name, false)
	for source_index in range(fighter.ARIANNA_LIGHT_KICK_SOURCE_START, fighter.ARIANNA_LIGHT_KICK_SOURCE_END + 1):
		frames.add_frame(&"arianna_light_kick", _make_light_kick_frame(source_index))
	for source_index in range(fighter.ARIANNA_LIGHT_KICK_SOURCE_END - 1, fighter.ARIANNA_LIGHT_KICK_SOURCE_START - 1, -1):
		frames.add_frame(&"arianna_light_kick_recovery", _make_light_kick_frame(source_index))


func _make_light_kick_frame(source_index: int) -> AtlasTexture:
	var atlas_frame := AtlasTexture.new()
	atlas_frame.atlas = fighter.ARIANNA_LIGHT_KICK_SHEET
	atlas_frame.region = Rect2(
		Vector2(
			float(source_index % fighter.ARIANNA_LIGHT_KICK_COLUMNS),
			float(source_index / fighter.ARIANNA_LIGHT_KICK_COLUMNS)
		) * fighter.ARIANNA_LIGHT_KICK_CELL_SIZE,
		fighter.ARIANNA_LIGHT_KICK_CELL_SIZE
	)
	return atlas_frame


func configure_low_light_kick_frames() -> void:
	var frames := animated_sprite.sprite_frames
	for animation_name in [&"arianna_low_light_kick", &"arianna_low_light_kick_recovery"]:
		if frames.has_animation(animation_name):
			frames.remove_animation(animation_name)
		frames.add_animation(animation_name)
		frames.set_animation_speed(animation_name, 60.0)
		frames.set_animation_loop(animation_name, false)
	for source_index in range(fighter.ARIANNA_LOW_LIGHT_KICK_FRAME_COUNT):
		frames.add_frame(&"arianna_low_light_kick", _make_low_light_kick_frame(source_index))
	for source_index in range(fighter.ARIANNA_LOW_LIGHT_KICK_FRAME_COUNT - 2, -1, -1):
		frames.add_frame(&"arianna_low_light_kick_recovery", _make_low_light_kick_frame(source_index))


func _make_low_light_kick_frame(source_index: int) -> AtlasTexture:
	var atlas_frame := AtlasTexture.new()
	atlas_frame.atlas = fighter.ARIANNA_LOW_LIGHT_KICK_SHEET
	atlas_frame.region = Rect2(
		Vector2(
			float(source_index % fighter.ARIANNA_LOW_LIGHT_KICK_COLUMNS),
			float(source_index / fighter.ARIANNA_LOW_LIGHT_KICK_COLUMNS)
		) * fighter.ARIANNA_LOW_LIGHT_KICK_CELL_SIZE,
		fighter.ARIANNA_LOW_LIGHT_KICK_CELL_SIZE
	)
	return atlas_frame


func configure_medium_kick_frames() -> void:
	var frames := animated_sprite.sprite_frames
	for animation_name in [&"arianna_medium_kick", &"arianna_medium_kick_recovery"]:
		if frames.has_animation(animation_name):
			frames.remove_animation(animation_name)
		frames.add_animation(animation_name)
		frames.set_animation_speed(animation_name, 48.0)
		frames.set_animation_loop(animation_name, false)
	for source_index in range(fighter.ARIANNA_MEDIUM_KICK_SOURCE_START, fighter.ARIANNA_MEDIUM_KICK_SOURCE_END + 1):
		frames.add_frame(&"arianna_medium_kick", _make_medium_kick_frame(source_index))
	for source_index in range(fighter.ARIANNA_MEDIUM_KICK_SOURCE_END - 1, fighter.ARIANNA_MEDIUM_KICK_SOURCE_START - 1, -1):
		frames.add_frame(&"arianna_medium_kick_recovery", _make_medium_kick_frame(source_index))


func _make_medium_kick_frame(source_index: int) -> AtlasTexture:
	var atlas_frame := AtlasTexture.new()
	atlas_frame.atlas = fighter.ARIANNA_MEDIUM_KICK_SHEET
	atlas_frame.region = Rect2(
		Vector2(
			float(source_index % fighter.ARIANNA_MEDIUM_KICK_COLUMNS),
			float(source_index / fighter.ARIANNA_MEDIUM_KICK_COLUMNS)
		) * fighter.ARIANNA_MEDIUM_KICK_CELL_SIZE,
		fighter.ARIANNA_MEDIUM_KICK_CELL_SIZE
	)
	return atlas_frame


func configure_low_medium_kick_frames() -> void:
	var frames := animated_sprite.sprite_frames
	for animation_name in [&"arianna_low_medium_kick", &"arianna_low_medium_kick_recovery"]:
		if frames.has_animation(animation_name):
			frames.remove_animation(animation_name)
		frames.add_animation(animation_name)
		frames.set_animation_speed(animation_name, 48.0)
		frames.set_animation_loop(animation_name, false)
	for source_index in range(fighter.ARIANNA_LOW_MEDIUM_KICK_SOURCE_START, fighter.ARIANNA_LOW_MEDIUM_KICK_SOURCE_END + 1):
		frames.add_frame(&"arianna_low_medium_kick", _make_low_medium_kick_frame(source_index))
	for source_index in range(fighter.ARIANNA_LOW_MEDIUM_KICK_SOURCE_END - 1, fighter.ARIANNA_LOW_MEDIUM_KICK_SOURCE_START - 1, -1):
		frames.add_frame(&"arianna_low_medium_kick_recovery", _make_low_medium_kick_frame(source_index))


func _make_low_medium_kick_frame(source_index: int) -> AtlasTexture:
	var atlas_frame := AtlasTexture.new()
	atlas_frame.atlas = fighter.ARIANNA_LOW_MEDIUM_KICK_SHEET
	atlas_frame.region = Rect2(Vector2(
		float(source_index % fighter.ARIANNA_LOW_MEDIUM_KICK_COLUMNS),
		float(source_index / fighter.ARIANNA_LOW_MEDIUM_KICK_COLUMNS)
	) * fighter.ARIANNA_LOW_MEDIUM_KICK_CELL_SIZE, fighter.ARIANNA_LOW_MEDIUM_KICK_CELL_SIZE)
	return atlas_frame


func configure_strong_kick_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"arianna_strong_kick"):
		frames.remove_animation(&"arianna_strong_kick")
	frames.add_animation(&"arianna_strong_kick")
	frames.set_animation_speed(&"arianna_strong_kick", 32.0)
	frames.set_animation_loop(&"arianna_strong_kick", false)
	for source_index in range(fighter.ARIANNA_STRONG_KICK_SOURCE_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.ARIANNA_STRONG_KICK_SHEET
		atlas_frame.region = Rect2(Vector2(
			float(source_index % fighter.ARIANNA_STRONG_KICK_COLUMNS),
			float(source_index / fighter.ARIANNA_STRONG_KICK_COLUMNS)
		) * fighter.ARIANNA_STRONG_KICK_CELL_SIZE, fighter.ARIANNA_STRONG_KICK_CELL_SIZE)
		frames.add_frame(&"arianna_strong_kick", atlas_frame)


func configure_low_strong_kick_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"arianna_low_strong_kick"):
		frames.remove_animation(&"arianna_low_strong_kick")
	frames.add_animation(&"arianna_low_strong_kick")
	frames.set_animation_speed(&"arianna_low_strong_kick", 48.0)
	frames.set_animation_loop(&"arianna_low_strong_kick", false)
	for source_index in range(fighter.ARIANNA_LOW_STRONG_KICK_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.ARIANNA_LOW_STRONG_KICK_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.ARIANNA_LOW_STRONG_KICK_COLUMNS),
				float(source_index / fighter.ARIANNA_LOW_STRONG_KICK_COLUMNS)
			) * fighter.ARIANNA_LOW_STRONG_KICK_CELL_SIZE,
			fighter.ARIANNA_LOW_STRONG_KICK_CELL_SIZE
		)
		frames.add_frame(&"arianna_low_strong_kick", atlas_frame)


func configure_jump_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"jump"):
		frames.remove_animation(&"jump")
	frames.add_animation(&"jump")
	frames.set_animation_speed(&"jump", fighter.ARIANNA_JUMP_FPS)
	frames.set_animation_loop(&"jump", false)
	for source_index in range(fighter.ARIANNA_JUMP_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.ARIANNA_JUMP_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.ARIANNA_JUMP_COLUMNS),
				float(floori(float(source_index) / fighter.ARIANNA_JUMP_COLUMNS))
			) * fighter.ARIANNA_JUMP_CELL_SIZE,
			fighter.ARIANNA_JUMP_CELL_SIZE
		)
		frames.add_frame(&"jump", atlas_frame)


func configure_jump_light_punch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"arianna_jump_light_punch"):
		frames.remove_animation(&"arianna_jump_light_punch")
	frames.add_animation(&"arianna_jump_light_punch")
	frames.set_animation_speed(&"arianna_jump_light_punch", 48.0)
	frames.set_animation_loop(&"arianna_jump_light_punch", false)
	var source_indices: Array[int] = []
	for source_index in range(
		fighter.ARIANNA_JUMP_LIGHT_PUNCH_SOURCE_START,
		fighter.ARIANNA_JUMP_LIGHT_PUNCH_SOURCE_FRAME_COUNT
	):
		source_indices.append(source_index)
	for hold_index in range(fighter.ARIANNA_JUMP_LIGHT_PUNCH_HOLD_FRAMES - 1):
		source_indices.append(fighter.ARIANNA_JUMP_LIGHT_PUNCH_SOURCE_FRAME_COUNT - 1)
	for source_index in range(
		fighter.ARIANNA_JUMP_LIGHT_PUNCH_SOURCE_FRAME_COUNT - 2,
		fighter.ARIANNA_JUMP_LIGHT_PUNCH_SOURCE_START - 1,
		-1
	):
		source_indices.append(source_index)
	for source_index in source_indices:
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.ARIANNA_JUMP_LIGHT_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.ARIANNA_JUMP_LIGHT_PUNCH_COLUMNS),
				float(source_index / fighter.ARIANNA_JUMP_LIGHT_PUNCH_COLUMNS)
			) * fighter.ARIANNA_JUMP_LIGHT_PUNCH_CELL_SIZE,
			fighter.ARIANNA_JUMP_LIGHT_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"arianna_jump_light_punch", atlas_frame)


func configure_jump_medium_punch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"arianna_jump_medium_punch"):
		frames.remove_animation(&"arianna_jump_medium_punch")
	frames.add_animation(&"arianna_jump_medium_punch")
	frames.set_animation_speed(&"arianna_jump_medium_punch", 48.0)
	frames.set_animation_loop(&"arianna_jump_medium_punch", false)
	for source_index in range(
		fighter.ARIANNA_JUMP_MEDIUM_PUNCH_SOURCE_START,
		fighter.ARIANNA_JUMP_MEDIUM_PUNCH_SOURCE_END + 1
	):
		_add_jump_medium_punch_frame(frames, source_index)
	# Recovery: dal fotogramma visibile 23 al 7, saltandone uno ogni due.
	for source_index in range(
		fighter.ARIANNA_JUMP_MEDIUM_PUNCH_SOURCE_END - 2,
		5,
		-2
	):
		_add_jump_medium_punch_frame(frames, source_index)


func _add_jump_medium_punch_frame(frames: SpriteFrames, source_index: int) -> void:
	var atlas_frame := AtlasTexture.new()
	atlas_frame.atlas = fighter.ARIANNA_JUMP_MEDIUM_PUNCH_SHEET
	atlas_frame.region = Rect2(
		Vector2(
			float(source_index % fighter.ARIANNA_JUMP_MEDIUM_PUNCH_COLUMNS),
			float(source_index / fighter.ARIANNA_JUMP_MEDIUM_PUNCH_COLUMNS)
		) * fighter.ARIANNA_JUMP_MEDIUM_PUNCH_CELL_SIZE,
		fighter.ARIANNA_JUMP_MEDIUM_PUNCH_CELL_SIZE
	)
	frames.add_frame(&"arianna_jump_medium_punch", atlas_frame)


func configure_jump_strong_punch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"arianna_jump_strong_punch"):
		frames.remove_animation(&"arianna_jump_strong_punch")
	frames.add_animation(&"arianna_jump_strong_punch")
	frames.set_animation_speed(&"arianna_jump_strong_punch", 48.0)
	frames.set_animation_loop(&"arianna_jump_strong_punch", false)
	for source_index in range(fighter.ARIANNA_JUMP_STRONG_PUNCH_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.ARIANNA_JUMP_STRONG_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.ARIANNA_JUMP_STRONG_PUNCH_COLUMNS),
				float(source_index / fighter.ARIANNA_JUMP_STRONG_PUNCH_COLUMNS)
			) * fighter.ARIANNA_JUMP_STRONG_PUNCH_CELL_SIZE,
			fighter.ARIANNA_JUMP_STRONG_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"arianna_jump_strong_punch", atlas_frame)


func configure_jump_light_kick_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"arianna_jump_light_kick"):
		frames.remove_animation(&"arianna_jump_light_kick")
	frames.add_animation(&"arianna_jump_light_kick")
	frames.set_animation_speed(&"arianna_jump_light_kick", 48.0)
	frames.set_animation_loop(&"arianna_jump_light_kick", false)
	for source_index in range(fighter.ARIANNA_JUMP_LIGHT_KICK_SOURCE_FRAME_COUNT):
		_add_jump_light_kick_frame(frames, source_index)
	for source_index in range(fighter.ARIANNA_JUMP_LIGHT_KICK_SOURCE_FRAME_COUNT - 2, -1, -1):
		_add_jump_light_kick_frame(frames, source_index)


func _add_jump_light_kick_frame(frames: SpriteFrames, source_index: int) -> void:
	var atlas_frame := AtlasTexture.new()
	atlas_frame.atlas = fighter.ARIANNA_JUMP_LIGHT_KICK_SHEET
	atlas_frame.region = Rect2(
		Vector2(
			float(source_index % fighter.ARIANNA_JUMP_LIGHT_KICK_COLUMNS),
			float(source_index / fighter.ARIANNA_JUMP_LIGHT_KICK_COLUMNS)
		) * fighter.ARIANNA_JUMP_LIGHT_KICK_CELL_SIZE,
		fighter.ARIANNA_JUMP_LIGHT_KICK_CELL_SIZE
	)
	frames.add_frame(&"arianna_jump_light_kick", atlas_frame)


func configure_jump_medium_kick_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"arianna_jump_medium_kick"):
		frames.remove_animation(&"arianna_jump_medium_kick")
	frames.add_animation(&"arianna_jump_medium_kick")
	frames.set_animation_speed(&"arianna_jump_medium_kick", 60.0)
	frames.set_animation_loop(&"arianna_jump_medium_kick", false)
	for source_index in range(fighter.ARIANNA_JUMP_MEDIUM_KICK_SOURCE_FRAME_COUNT):
		_add_jump_medium_kick_frame(frames, source_index)
	for source_index in range(
		fighter.ARIANNA_JUMP_MEDIUM_KICK_SOURCE_FRAME_COUNT - 2,
		fighter.ARIANNA_JUMP_MEDIUM_KICK_RECOVERY_END_SOURCE_FRAME - 1,
		-1
	):
		_add_jump_medium_kick_frame(frames, source_index)


func _add_jump_medium_kick_frame(frames: SpriteFrames, source_index: int) -> void:
	var atlas_frame := AtlasTexture.new()
	atlas_frame.atlas = fighter.ARIANNA_JUMP_MEDIUM_KICK_SHEET
	atlas_frame.region = Rect2(
		Vector2(
			float(source_index % fighter.ARIANNA_JUMP_MEDIUM_KICK_COLUMNS),
			float(source_index / fighter.ARIANNA_JUMP_MEDIUM_KICK_COLUMNS)
		) * fighter.ARIANNA_JUMP_MEDIUM_KICK_CELL_SIZE,
		fighter.ARIANNA_JUMP_MEDIUM_KICK_CELL_SIZE
	)
	frames.add_frame(&"arianna_jump_medium_kick", atlas_frame)


func configure_jump_strong_kick_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"arianna_jump_strong_kick"):
		frames.remove_animation(&"arianna_jump_strong_kick")
	frames.add_animation(&"arianna_jump_strong_kick")
	frames.set_animation_speed(&"arianna_jump_strong_kick", 48.0)
	frames.set_animation_loop(&"arianna_jump_strong_kick", false)
	for source_index in range(fighter.ARIANNA_JUMP_STRONG_KICK_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.ARIANNA_JUMP_STRONG_KICK_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.ARIANNA_JUMP_STRONG_KICK_COLUMNS),
				float(source_index / fighter.ARIANNA_JUMP_STRONG_KICK_COLUMNS)
			) * fighter.ARIANNA_JUMP_STRONG_KICK_CELL_SIZE,
			fighter.ARIANNA_JUMP_STRONG_KICK_CELL_SIZE
		)
		frames.add_frame(&"arianna_jump_strong_kick", atlas_frame)


func configure_baseball_special_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"arianna_baseball_special"):
		frames.remove_animation(&"arianna_baseball_special")
	frames.add_animation(&"arianna_baseball_special")
	frames.set_animation_speed(&"arianna_baseball_special", 48.0)
	frames.set_animation_loop(&"arianna_baseball_special", false)
	for source_index in range(fighter.ARIANNA_BASEBALL_SPECIAL_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.ARIANNA_BASEBALL_SPECIAL_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.ARIANNA_BASEBALL_SPECIAL_COLUMNS),
				float(source_index / fighter.ARIANNA_BASEBALL_SPECIAL_COLUMNS)
			) * fighter.ARIANNA_BASEBALL_SPECIAL_CELL_SIZE,
			fighter.ARIANNA_BASEBALL_SPECIAL_CELL_SIZE
		)
		frames.add_frame(&"arianna_baseball_special", atlas_frame)


func configure_points_forward_super_frames() -> void:
	var frames := animated_sprite.sprite_frames
	var animation_name := &"arianna_points_forward_super"
	if frames.has_animation(animation_name):
		frames.remove_animation(animation_name)
	frames.add_animation(animation_name)
	frames.set_animation_speed(animation_name, 24.0)
	frames.set_animation_loop(animation_name, false)
	for source_index in range(
		fighter.ARIANNA_POINTS_FORWARD_SUPER_SOURCE_START,
		fighter.ARIANNA_POINTS_FORWARD_SUPER_SOURCE_END + 1
	):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.ARIANNA_POINTS_FORWARD_SUPER_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.ARIANNA_POINTS_FORWARD_SUPER_COLUMNS),
				float(source_index / fighter.ARIANNA_POINTS_FORWARD_SUPER_COLUMNS)
			) * fighter.ARIANNA_POINTS_FORWARD_SUPER_CELL_SIZE,
			fighter.ARIANNA_POINTS_FORWARD_SUPER_CELL_SIZE
		)
		frames.add_frame(animation_name, atlas_frame)


func configure_whistle_special_frames() -> void:
	var frames := animated_sprite.sprite_frames
	var animation_name := &"arianna_whistle_special"
	if frames.has_animation(animation_name):
		frames.remove_animation(animation_name)
	frames.add_animation(animation_name)
	frames.set_animation_speed(animation_name, 24.0)
	frames.set_animation_loop(animation_name, false)
	var source_sequence: Array[int] = []
	for source_index in range(fighter.ARIANNA_WHISTLE_SPECIAL_SOURCE_FRAME_COUNT):
		source_sequence.append(source_index)
	for source_index in range(
		fighter.ARIANNA_WHISTLE_SPECIAL_SOURCE_FRAME_COUNT - 2,
		-1,
		-1
	):
		source_sequence.append(source_index)
	for source_index in source_sequence:
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.ARIANNA_WHISTLE_SPECIAL_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.ARIANNA_WHISTLE_SPECIAL_COLUMNS),
				float(source_index / fighter.ARIANNA_WHISTLE_SPECIAL_COLUMNS)
			) * fighter.ARIANNA_WHISTLE_SPECIAL_CELL_SIZE,
			fighter.ARIANNA_WHISTLE_SPECIAL_CELL_SIZE
		)
		frames.add_frame(animation_name, atlas_frame)


func configure_hurt_medium_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"hurt_mid"):
		frames.remove_animation(&"hurt_mid")
	frames.add_animation(&"hurt_mid")
	frames.set_animation_speed(&"hurt_mid", 48.0)
	frames.set_animation_loop(&"hurt_mid", false)
	var source_sequence: Array[int] = []
	for source_index in range(fighter.ARIANNA_HURT_MEDIUM_SOURCE_FRAME_COUNT):
		source_sequence.append(source_index)
	for source_index in range(fighter.ARIANNA_HURT_MEDIUM_SOURCE_FRAME_COUNT - 2, -1, -1):
		source_sequence.append(source_index)
	for source_index in source_sequence:
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.ARIANNA_HURT_MEDIUM_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.ARIANNA_HURT_MEDIUM_COLUMNS),
				float(source_index / fighter.ARIANNA_HURT_MEDIUM_COLUMNS)
			) * fighter.ARIANNA_HURT_MEDIUM_CELL_SIZE,
			fighter.ARIANNA_HURT_MEDIUM_CELL_SIZE
		)
		frames.add_frame(&"hurt_mid", atlas_frame)


func configure_hurt_high_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"hurt_high"):
		frames.remove_animation(&"hurt_high")
	frames.add_animation(&"hurt_high")
	frames.set_animation_speed(&"hurt_high", 24.0)
	frames.set_animation_loop(&"hurt_high", false)
	# Riproduce i sette fotogrammi sorgente e richiude visivamente sul primo
	# prima che FighterCombat riporti Arianna in idle.
	for animation_index in range(fighter.ARIANNA_HURT_HIGH_FRAME_COUNT + 1):
		var source_index: int = (
			animation_index if animation_index < fighter.ARIANNA_HURT_HIGH_FRAME_COUNT else 0
		)
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.ARIANNA_HURT_HIGH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.ARIANNA_HURT_HIGH_COLUMNS),
				float(source_index / fighter.ARIANNA_HURT_HIGH_COLUMNS)
			) * fighter.ARIANNA_HURT_HIGH_CELL_SIZE,
			fighter.ARIANNA_HURT_HIGH_CELL_SIZE
		)
		frames.add_frame(&"hurt_high", atlas_frame)


func configure_hurt_low_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"hurt_low"):
		frames.remove_animation(&"hurt_low")
	frames.add_animation(&"hurt_low")
	frames.set_animation_speed(&"hurt_low", 24.0)
	frames.set_animation_loop(&"hurt_low", false)
	# Esegue i sei fotogrammi sorgente e torna al primo prima dell'idle.
	for animation_index in range(fighter.ARIANNA_HURT_LOW_FRAME_COUNT + 1):
		var source_index: int = (
			animation_index if animation_index < fighter.ARIANNA_HURT_LOW_FRAME_COUNT else 0
		)
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.ARIANNA_HURT_LOW_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.ARIANNA_HURT_LOW_COLUMNS),
				float(source_index / fighter.ARIANNA_HURT_LOW_COLUMNS)
			) * fighter.ARIANNA_HURT_LOW_CELL_SIZE,
			fighter.ARIANNA_HURT_LOW_CELL_SIZE
		)
		frames.add_frame(&"hurt_low", atlas_frame)


func configure_sweep_knockdown_frames() -> void:
	configure_full_atlas_animation(
		&"sweep_knockdown",
		fighter.ARIANNA_SWEEP_KNOCKDOWN_SHEET,
		fighter.ARIANNA_SWEEP_KNOCKDOWN_FRAME_COUNT,
		fighter.ARIANNA_SWEEP_KNOCKDOWN_COLUMNS,
		fighter.ARIANNA_SWEEP_KNOCKDOWN_CELL_SIZE
	)


func configure_knockdown_recovery_frames() -> void:
	configure_full_atlas_animation(
		&"knockdown_recovery",
		fighter.ARIANNA_KNOCKDOWN_RECOVERY_SHEET,
		fighter.ARIANNA_KNOCKDOWN_RECOVERY_FRAME_COUNT,
		fighter.ARIANNA_KNOCKDOWN_RECOVERY_COLUMNS,
		fighter.ARIANNA_KNOCKDOWN_RECOVERY_CELL_SIZE
	)


func configure_ko_frames() -> void:
	configure_full_atlas_animation(
		&"ko",
		fighter.ARIANNA_KO_SHEET,
		fighter.ARIANNA_KO_FRAME_COUNT,
		fighter.ARIANNA_KO_COLUMNS,
		fighter.ARIANNA_KO_CELL_SIZE
	)


func configure_victory_frames() -> void:
	configure_full_atlas_animation(
		&"victory",
		fighter.ARIANNA_VICTORY_SHEET,
		fighter.ARIANNA_VICTORY_FRAME_COUNT,
		fighter.ARIANNA_VICTORY_COLUMNS,
		fighter.ARIANNA_VICTORY_CELL_SIZE
	)


func configure_full_atlas_animation(
	animation_name: StringName,
	atlas: Texture2D,
	frame_count: int,
	columns: int,
	cell_size: Vector2
) -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(animation_name):
		frames.remove_animation(animation_name)
	frames.add_animation(animation_name)
	frames.set_animation_speed(animation_name, 24.0)
	frames.set_animation_loop(animation_name, false)
	for source_index in range(frame_count):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = atlas
		atlas_frame.region = Rect2(
			Vector2(float(source_index % columns), float(source_index / columns)) * cell_size,
			cell_size
		)
		frames.add_frame(animation_name, atlas_frame)


func configure_hurted_in_jump_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"hurted_in_jump"):
		frames.remove_animation(&"hurted_in_jump")
	frames.add_animation(&"hurted_in_jump")
	frames.set_animation_speed(&"hurted_in_jump", 24.0)
	frames.set_animation_loop(&"hurted_in_jump", false)
	var sheet: Texture2D = fighter.get_texture("assets/sprites/characters/arianna/basic-moves/hurted_in_jump.png")
	for index in 17:
		var texture := AtlasTexture.new()
		texture.atlas = sheet
		texture.region = Rect2((index % 5) * 512, int(index / 5) * 512, 512, 512)
		frames.add_frame(&"hurted_in_jump", texture)
