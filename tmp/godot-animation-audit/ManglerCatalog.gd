extends RefCounted

## Costruisce gli SpriteFrames runtime di Mangler senza mescolare slicing e gameplay.

var fighter: Node
var animated_sprite: AnimatedSprite2D
var grab_front_sprite: AnimatedSprite2D


func _init(owner: Node) -> void:
	fighter = owner
	animated_sprite = owner.get_node("AnimatedSprite2D") as AnimatedSprite2D
	grab_front_sprite = owner.get_node("GrabFrontSprite") as AnimatedSprite2D


func configure_all() -> void:
	configure_idle_frames()
	configure_walk_frames()
	configure_backwalk_frames()
	configure_run_frames()
	configure_crouched_heavy_punch_frames()
	configure_heavy_punch_high_frames()
	configure_crouch_frames()
	configure_block_high_frames()
	configure_block_mid_frames()
	configure_block_low_frames()
	configure_standing_heavy_kick_frames()
	configure_crouched_heavy_kick_frames()
	configure_sweep_knockdown_frames()
	configure_standing_medium_kick_frames()
	configure_crouched_medium_kick_frames()
	configure_standing_light_kick_frames()
	configure_crouched_light_kick_frames()
	configure_jump_light_kick_frames()
	configure_jump_light_punch_frames()
	configure_jump_heavy_kick_frames()
	configure_jump_medium_kick_frames()
	configure_crouched_light_punch_crouched_frames()
	configure_crouched_light_punch_frames()
	configure_light_punch_frames()
	configure_crouched_medium_punch_frames()
	configure_crouched_medium_punch_crouched_frames()
	configure_medium_punch_frames()
	configure_jump_medium_punch_frames()
	configure_jump_heavy_punch_frames()
	configure_special_720_punch_frames()
	configure_special_sonic_boom_frames()
	configure_grab_tentative_frames()
	configure_grab_headbutt_frames()
	configure_grab_headbow_combined_frames()
	configure_super_start_frames()
	configure_super_rotate_run_frames()
	configure_super_run_only_frames()
	configure_super_drum_roll_frames()
	configure_super_drum_hurt_frames()
	configure_super_drum_knockdown_frames()
	configure_grabbed_frames()
	configure_hurted_in_jump_frames()
	configure_victory_frames()


func configure_idle_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"idle"):
		frames.remove_animation(&"idle")
	frames.add_animation(&"idle")
	frames.set_animation_speed(&"idle", 24.0)
	frames.set_animation_loop(&"idle", true)
	for source_index in range(fighter.IDLE_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.IDLE_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				(source_index % fighter.IDLE_COLUMNS) * fighter.IDLE_CELL_SIZE.x,
				(source_index / fighter.IDLE_COLUMNS) * fighter.IDLE_CELL_SIZE.y
			),
			fighter.IDLE_CELL_SIZE
		)
		frames.add_frame(&"idle", atlas_frame)


func configure_walk_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"walk"):
		frames.remove_animation(&"walk")
	frames.add_animation(&"walk")
	frames.set_animation_speed(&"walk", 24.0)
	frames.set_animation_loop(&"walk", true)
	for source_index in range(fighter.WALK_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.WALK_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				(source_index % fighter.WALK_COLUMNS) * fighter.WALK_CELL_SIZE.x,
				(source_index / fighter.WALK_COLUMNS) * fighter.WALK_CELL_SIZE.y
			),
			fighter.WALK_CELL_SIZE
		)
		frames.add_frame(&"walk", atlas_frame)


func configure_backwalk_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"backwalk"):
		frames.remove_animation(&"backwalk")
	frames.add_animation(&"backwalk")
	frames.set_animation_speed(&"backwalk", 24.0)
	frames.set_animation_loop(&"backwalk", true)
	for source_index in range(fighter.BACKWALK_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.BACKWALK_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				(source_index % fighter.BACKWALK_COLUMNS) * fighter.BACKWALK_CELL_SIZE.x,
				(source_index / fighter.BACKWALK_COLUMNS) * fighter.BACKWALK_CELL_SIZE.y
			),
			fighter.BACKWALK_CELL_SIZE
		)
		frames.add_frame(&"backwalk", atlas_frame)


func configure_run_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"run"):
		frames.remove_animation(&"run")
	frames.add_animation(&"run")
	frames.set_animation_speed(&"run", 24.0)
	frames.set_animation_loop(&"run", true)
	for source_index in range(fighter.RUN_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.RUN_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				(source_index % fighter.RUN_COLUMNS) * fighter.RUN_CELL_SIZE.x,
				(source_index / fighter.RUN_COLUMNS) * fighter.RUN_CELL_SIZE.y
			),
			fighter.RUN_CELL_SIZE
		)
		frames.add_frame(&"run", atlas_frame)


func configure_crouched_heavy_punch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"crouched_power_punch"):
		frames.remove_animation(&"crouched_power_punch")
	frames.add_animation(&"crouched_power_punch")
	frames.set_animation_speed(&"crouched_power_punch", 48.0)
	frames.set_animation_loop(&"crouched_power_punch", false)
	# Avanzata 0-24 (hitbox al 19); rovesciata 23-0 (recovery).
	for source_index in range(fighter.CROUCHED_HEAVY_PUNCH_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.CROUCHED_HEAVY_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.CROUCHED_HEAVY_PUNCH_COLUMNS),
				float(floori(float(source_index) / fighter.CROUCHED_HEAVY_PUNCH_COLUMNS))
			) * fighter.CROUCHED_HEAVY_PUNCH_CELL_SIZE,
			fighter.CROUCHED_HEAVY_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"crouched_power_punch", atlas_frame)
	for source_index in range(fighter.CROUCHED_HEAVY_PUNCH_FRAME_COUNT - 2, -1, -1):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.CROUCHED_HEAVY_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.CROUCHED_HEAVY_PUNCH_COLUMNS),
				float(floori(float(source_index) / fighter.CROUCHED_HEAVY_PUNCH_COLUMNS))
			) * fighter.CROUCHED_HEAVY_PUNCH_CELL_SIZE,
			fighter.CROUCHED_HEAVY_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"crouched_power_punch", atlas_frame, 48.0 / 60.0)


func configure_heavy_punch_high_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"heavy_punch"):
		frames.remove_animation(&"heavy_punch")
	frames.add_animation(&"heavy_punch")
	frames.set_animation_speed(&"heavy_punch", 48.0)
	frames.set_animation_loop(&"heavy_punch", false)
	for source_index in range(fighter.HEAVY_PUNCH_HIGH_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.HEAVY_PUNCH_HIGH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				(source_index % fighter.HEAVY_PUNCH_HIGH_COLUMNS) * fighter.HEAVY_PUNCH_HIGH_CELL_SIZE.x,
				(source_index / fighter.HEAVY_PUNCH_HIGH_COLUMNS) * fighter.HEAVY_PUNCH_HIGH_CELL_SIZE.y
			),
			fighter.HEAVY_PUNCH_HIGH_CELL_SIZE
		)
		frames.add_frame(&"heavy_punch", atlas_frame)
	for source_index in range(40, 19, -1):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.HEAVY_PUNCH_HIGH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				(source_index % fighter.HEAVY_PUNCH_HIGH_COLUMNS) * fighter.HEAVY_PUNCH_HIGH_CELL_SIZE.x,
				(source_index / fighter.HEAVY_PUNCH_HIGH_COLUMNS) * fighter.HEAVY_PUNCH_HIGH_CELL_SIZE.y
			),
			fighter.HEAVY_PUNCH_HIGH_CELL_SIZE
		)
		frames.add_frame(&"heavy_punch", atlas_frame)


func configure_crouch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"crouch"):
		frames.remove_animation(&"crouch")
	frames.add_animation(&"crouch")
	frames.set_animation_speed(&"crouch", 48.0)
	frames.set_animation_loop(&"crouch", false)
	for source_index in range(fighter.CROUCH_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.CROUCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				(source_index % fighter.CROUCH_COLUMNS) * fighter.CROUCH_CELL_SIZE.x,
				(source_index / fighter.CROUCH_COLUMNS) * fighter.CROUCH_CELL_SIZE.y
			),
			fighter.CROUCH_CELL_SIZE
		)
		frames.add_frame(&"crouch", atlas_frame)


func configure_block_high_frames() -> void:
	var frames := animated_sprite.sprite_frames
	for animation_name in [&"block_high", &"block_high_recovery"]:
		if frames.has_animation(animation_name):
			frames.remove_animation(animation_name)
		frames.add_animation(animation_name)
		frames.set_animation_speed(animation_name, 48.0)
		frames.set_animation_loop(animation_name, false)

	for source_index in range(8, fighter.BLOCK_HIGH_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.BLOCK_HIGH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				(source_index % fighter.BLOCK_HIGH_COLUMNS) * fighter.BLOCK_HIGH_CELL_SIZE.x,
				(source_index / fighter.BLOCK_HIGH_COLUMNS) * fighter.BLOCK_HIGH_CELL_SIZE.y
			),
			fighter.BLOCK_HIGH_CELL_SIZE
		)
		frames.add_frame(&"block_high", atlas_frame)

	for source_index in range(fighter.BLOCK_HIGH_FRAME_COUNT - 2, -1, -1):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.BLOCK_HIGH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				(source_index % fighter.BLOCK_HIGH_COLUMNS) * fighter.BLOCK_HIGH_CELL_SIZE.x,
				(source_index / fighter.BLOCK_HIGH_COLUMNS) * fighter.BLOCK_HIGH_CELL_SIZE.y
			),
			fighter.BLOCK_HIGH_CELL_SIZE
		)
		frames.add_frame(&"block_high_recovery", atlas_frame)


func configure_block_mid_frames() -> void:
	var frames := animated_sprite.sprite_frames
	for animation_name in [&"block_mid", &"block_mid_recovery"]:
		if frames.has_animation(animation_name):
			frames.remove_animation(animation_name)
		frames.add_animation(animation_name)
		frames.set_animation_speed(animation_name, 24.0)
		frames.set_animation_loop(animation_name, false)

	for source_index in range(fighter.BLOCK_MID_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.BLOCK_MID_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				(source_index % fighter.BLOCK_MID_COLUMNS) * fighter.BLOCK_MID_CELL_SIZE.x,
				(source_index / fighter.BLOCK_MID_COLUMNS) * fighter.BLOCK_MID_CELL_SIZE.y
			),
			fighter.BLOCK_MID_CELL_SIZE
		)
		frames.add_frame(&"block_mid", atlas_frame)

	for source_index in range(fighter.BLOCK_MID_FRAME_COUNT - 2, -1, -1):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.BLOCK_MID_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				(source_index % fighter.BLOCK_MID_COLUMNS) * fighter.BLOCK_MID_CELL_SIZE.x,
				(source_index / fighter.BLOCK_MID_COLUMNS) * fighter.BLOCK_MID_CELL_SIZE.y
			),
			fighter.BLOCK_MID_CELL_SIZE
		)
		frames.add_frame(&"block_mid_recovery", atlas_frame)


func configure_block_low_frames() -> void:
	var frames := animated_sprite.sprite_frames
	for animation_name in [&"block_low", &"block_low_crouched", &"block_low_recovery"]:
		if frames.has_animation(animation_name):
			frames.remove_animation(animation_name)
		frames.add_animation(animation_name)
		frames.set_animation_speed(animation_name, 24.0)
		frames.set_animation_loop(animation_name, false)

	for source_index in range(fighter.BLOCK_LOW_FRAME_COUNT):
		for animation_name in [&"block_low", &"block_low_crouched"]:
			var atlas_frame := AtlasTexture.new()
			atlas_frame.atlas = fighter.BLOCK_LOW_SHEET
			atlas_frame.region = Rect2(
				Vector2(
					(source_index % fighter.BLOCK_LOW_COLUMNS) * fighter.BLOCK_LOW_CELL_SIZE.x,
					(source_index / fighter.BLOCK_LOW_COLUMNS) * fighter.BLOCK_LOW_CELL_SIZE.y
				),
				fighter.BLOCK_LOW_CELL_SIZE
			)
			frames.add_frame(animation_name, atlas_frame)

	for source_index in range(fighter.BLOCK_LOW_FRAME_COUNT - 2, -1, -1):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.BLOCK_LOW_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				(source_index % fighter.BLOCK_LOW_COLUMNS) * fighter.BLOCK_LOW_CELL_SIZE.x,
				(source_index / fighter.BLOCK_LOW_COLUMNS) * fighter.BLOCK_LOW_CELL_SIZE.y
			),
			fighter.BLOCK_LOW_CELL_SIZE
		)
		frames.add_frame(&"block_low_recovery", atlas_frame)


func configure_standing_heavy_kick_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"heavy_kick"):
		frames.remove_animation(&"heavy_kick")
	frames.add_animation(&"heavy_kick")
	frames.set_animation_speed(&"heavy_kick", 48.0)
	frames.set_animation_loop(&"heavy_kick", false)
	# Avanzata: fotogrammi 21-48 (hitbox al 24); rovesciata: 47-21 (recovery).
	for source_index in range(21, fighter.STRONG_KICK_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.STRONG_KICK_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.STRONG_KICK_COLUMNS),
				float(floori(float(source_index) / fighter.STRONG_KICK_COLUMNS))
			) * fighter.STRONG_KICK_CELL_SIZE,
			fighter.STRONG_KICK_CELL_SIZE
		)
		frames.add_frame(&"heavy_kick", atlas_frame)
	for source_index in range(fighter.STRONG_KICK_FRAME_COUNT - 2, 20, -1):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.STRONG_KICK_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.STRONG_KICK_COLUMNS),
				float(floori(float(source_index) / fighter.STRONG_KICK_COLUMNS))
			) * fighter.STRONG_KICK_CELL_SIZE,
			fighter.STRONG_KICK_CELL_SIZE
		)
		frames.add_frame(&"heavy_kick", atlas_frame)


func configure_crouched_heavy_kick_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"crouched_heavy_kick"):
		frames.remove_animation(&"crouched_heavy_kick")
	frames.add_animation(&"crouched_heavy_kick")
	frames.set_animation_speed(&"crouched_heavy_kick", 48.0)
	frames.set_animation_loop(&"crouched_heavy_kick", false)
	# Tutti i fotogrammi 0-48; hitbox attivo circa a frame 30.
	for source_index in range(0, fighter.CROUCHED_HEAVY_KICK_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.CROUCHED_HEAVY_KICK_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.CROUCHED_HEAVY_KICK_COLUMNS),
				float(floori(float(source_index) / fighter.CROUCHED_HEAVY_KICK_COLUMNS))
			) * fighter.CROUCHED_HEAVY_KICK_CELL_SIZE,
			fighter.CROUCHED_HEAVY_KICK_CELL_SIZE
		)
		frames.add_frame(&"crouched_heavy_kick", atlas_frame)


func configure_sweep_knockdown_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"sweep_knockdown"):
		frames.remove_animation(&"sweep_knockdown")
	frames.add_animation(&"sweep_knockdown")
	frames.set_animation_speed(&"sweep_knockdown", 48.0)
	frames.set_animation_loop(&"sweep_knockdown", false)
	for source_index in range(0, fighter.SWEEP_KNOCKDOWN_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.SWEEP_KNOCKDOWN_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.SWEEP_KNOCKDOWN_COLUMNS),
				float(floori(float(source_index) / fighter.SWEEP_KNOCKDOWN_COLUMNS))
			) * fighter.SWEEP_KNOCKDOWN_CELL_SIZE,
			fighter.SWEEP_KNOCKDOWN_CELL_SIZE
		)
		frames.add_frame(&"sweep_knockdown", atlas_frame)


func configure_standing_medium_kick_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"medium_kick"):
		frames.remove_animation(&"medium_kick")
	frames.add_animation(&"medium_kick")
	frames.set_animation_speed(&"medium_kick", 48.0)
	frames.set_animation_loop(&"medium_kick", false)
	# Avanzata: fotogrammi 14-41 (hitbox ai pos. 26-27); rovesciata: 40-14 (recovery).
	for source_index in range(14, fighter.MEDIUM_KICK_STANDING_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.MEDIUM_KICK_STANDING_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.MEDIUM_KICK_STANDING_COLUMNS),
				float(floori(float(source_index) / fighter.MEDIUM_KICK_STANDING_COLUMNS))
			) * fighter.MEDIUM_KICK_STANDING_CELL_SIZE,
			fighter.MEDIUM_KICK_STANDING_CELL_SIZE
		)
		frames.add_frame(&"medium_kick", atlas_frame)
	for source_index in range(fighter.MEDIUM_KICK_STANDING_FRAME_COUNT - 2, 13, -1):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.MEDIUM_KICK_STANDING_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.MEDIUM_KICK_STANDING_COLUMNS),
				float(floori(float(source_index) / fighter.MEDIUM_KICK_STANDING_COLUMNS))
			) * fighter.MEDIUM_KICK_STANDING_CELL_SIZE,
			fighter.MEDIUM_KICK_STANDING_CELL_SIZE
		)
		frames.add_frame(&"medium_kick", atlas_frame)


func configure_crouched_medium_kick_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"crouched_medium_kick"):
		frames.remove_animation(&"crouched_medium_kick")
	frames.add_animation(&"crouched_medium_kick")
	frames.set_animation_speed(&"crouched_medium_kick", 48.0)
	frames.set_animation_loop(&"crouched_medium_kick", false)
	# Avanzata: fotogrammi 0-24; hitbox attivo a 22-24; recovery: 23-0.
	for source_index in range(0, 25):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.CROUCHED_MEDIUM_KICK_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.CROUCHED_MEDIUM_KICK_COLUMNS),
				float(floori(float(source_index) / fighter.CROUCHED_MEDIUM_KICK_COLUMNS))
			) * fighter.CROUCHED_MEDIUM_KICK_CELL_SIZE,
			fighter.CROUCHED_MEDIUM_KICK_CELL_SIZE
		)
		frames.add_frame(&"crouched_medium_kick", atlas_frame)
	for source_index in range(23, -1, -1):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.CROUCHED_MEDIUM_KICK_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.CROUCHED_MEDIUM_KICK_COLUMNS),
				float(floori(float(source_index) / fighter.CROUCHED_MEDIUM_KICK_COLUMNS))
			) * fighter.CROUCHED_MEDIUM_KICK_CELL_SIZE,
			fighter.CROUCHED_MEDIUM_KICK_CELL_SIZE
		)
		frames.add_frame(&"crouched_medium_kick", atlas_frame)


func configure_standing_light_kick_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"light_kick"):
		frames.remove_animation(&"light_kick")
	frames.add_animation(&"light_kick")
	frames.set_animation_speed(&"light_kick", 48.0)
	frames.set_animation_loop(&"light_kick", false)
	# Avanzata: fotogrammi 10-24 (startup + impatto al 24); rovesciata: 23-10 (recovery).
	for source_index in range(10, fighter.LIGHT_KICK_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.LIGHT_KICK_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.LIGHT_KICK_COLUMNS),
				float(floori(float(source_index) / fighter.LIGHT_KICK_COLUMNS))
			) * fighter.LIGHT_KICK_CELL_SIZE,
			fighter.LIGHT_KICK_CELL_SIZE
		)
		frames.add_frame(&"light_kick", atlas_frame)
	for source_index in range(fighter.LIGHT_KICK_FRAME_COUNT - 2, 9, -1):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.LIGHT_KICK_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.LIGHT_KICK_COLUMNS),
				float(floori(float(source_index) / fighter.LIGHT_KICK_COLUMNS))
			) * fighter.LIGHT_KICK_CELL_SIZE,
			fighter.LIGHT_KICK_CELL_SIZE
		)
		frames.add_frame(&"light_kick", atlas_frame)


func configure_crouched_light_kick_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"crouched_light_kick"):
		frames.remove_animation(&"crouched_light_kick")
	frames.add_animation(&"crouched_light_kick")
	frames.set_animation_speed(&"crouched_light_kick", 48.0)
	frames.set_animation_loop(&"crouched_light_kick", false)
	# Avanzata: fotogrammi 6-21; hitbox attivo a 19-21; recovery: 20-6.
	for source_index in range(6, 22):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.CROUCHED_LIGHT_KICK_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.CROUCHED_LIGHT_KICK_COLUMNS),
				float(floori(float(source_index) / fighter.CROUCHED_LIGHT_KICK_COLUMNS))
			) * fighter.CROUCHED_LIGHT_KICK_CELL_SIZE,
			fighter.CROUCHED_LIGHT_KICK_CELL_SIZE
		)
		frames.add_frame(&"crouched_light_kick", atlas_frame)
	for source_index in range(20, 5, -1):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.CROUCHED_LIGHT_KICK_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.CROUCHED_LIGHT_KICK_COLUMNS),
				float(floori(float(source_index) / fighter.CROUCHED_LIGHT_KICK_COLUMNS))
			) * fighter.CROUCHED_LIGHT_KICK_CELL_SIZE,
			fighter.CROUCHED_LIGHT_KICK_CELL_SIZE
		)
		frames.add_frame(&"crouched_light_kick", atlas_frame)


func configure_jump_light_kick_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"jump_light_kick"):
		frames.remove_animation(&"jump_light_kick")
	frames.add_animation(&"jump_light_kick")
	frames.set_animation_speed(&"jump_light_kick", 48.0)
	frames.set_animation_loop(&"jump_light_kick", false)
	for source_index in fighter.JUMP_LIGHT_KICK_SOURCE_SEQUENCE:
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.JUMP_LIGHT_KICK_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.JUMP_LIGHT_KICK_COLUMNS),
				float(floori(float(source_index) / fighter.JUMP_LIGHT_KICK_COLUMNS))
			) * fighter.JUMP_LIGHT_KICK_CELL_SIZE,
			fighter.JUMP_LIGHT_KICK_CELL_SIZE
		)
		frames.add_frame(&"jump_light_kick", atlas_frame)


func configure_jump_light_punch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"jump_light_punch"):
		frames.remove_animation(&"jump_light_punch")
	frames.add_animation(&"jump_light_punch")
	frames.set_animation_speed(&"jump_light_punch", 48.0)
	frames.set_animation_loop(&"jump_light_punch", false)
	for source_index in fighter.JUMP_LIGHT_PUNCH_SOURCE_SEQUENCE:
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.JUMP_LIGHT_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.JUMP_LIGHT_PUNCH_COLUMNS),
				float(floori(float(source_index) / fighter.JUMP_LIGHT_PUNCH_COLUMNS))
			) * fighter.JUMP_LIGHT_PUNCH_CELL_SIZE,
			fighter.JUMP_LIGHT_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"jump_light_punch", atlas_frame)


func configure_jump_heavy_kick_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"jump_heavy_kick"):
		frames.remove_animation(&"jump_heavy_kick")
	frames.add_animation(&"jump_heavy_kick")
	frames.set_animation_speed(&"jump_heavy_kick", 48.0)
	frames.set_animation_loop(&"jump_heavy_kick", false)
	for source_index in fighter.JUMP_HEAVY_KICK_SOURCE_SEQUENCE:
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.JUMP_HEAVY_KICK_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.JUMP_HEAVY_KICK_COLUMNS),
				float(floori(float(source_index) / fighter.JUMP_HEAVY_KICK_COLUMNS))
			) * fighter.JUMP_HEAVY_KICK_CELL_SIZE,
			fighter.JUMP_HEAVY_KICK_CELL_SIZE
		)
		frames.add_frame(&"jump_heavy_kick", atlas_frame)


func configure_jump_medium_kick_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"jump_medium_kick"):
		frames.remove_animation(&"jump_medium_kick")
	frames.add_animation(&"jump_medium_kick")
	frames.set_animation_speed(&"jump_medium_kick", 48.0)
	frames.set_animation_loop(&"jump_medium_kick", false)
	for source_index in fighter.JUMP_MEDIUM_KICK_SOURCE_SEQUENCE:
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.JUMP_MEDIUM_KICK_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.JUMP_MEDIUM_KICK_COLUMNS),
				float(floori(float(source_index) / fighter.JUMP_MEDIUM_KICK_COLUMNS))
			) * fighter.JUMP_MEDIUM_KICK_CELL_SIZE,
			fighter.JUMP_MEDIUM_KICK_CELL_SIZE
		)
		frames.add_frame(&"jump_medium_kick", atlas_frame)


func configure_crouched_light_punch_crouched_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"crouched_punch_crouched"):
		frames.remove_animation(&"crouched_punch_crouched")
	frames.add_animation(&"crouched_punch_crouched")
	frames.set_animation_speed(&"crouched_punch_crouched", 48.0)
	frames.set_animation_loop(&"crouched_punch_crouched", false)
	# Parte dal frame 12 (metà sequenza, già in carica); stesso schema step=2 e impatto.
	for source_index in range(12, 19, 2):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.CROUCHED_LIGHT_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.CROUCHED_LIGHT_PUNCH_COLUMNS),
				float(floori(float(source_index) / fighter.CROUCHED_LIGHT_PUNCH_COLUMNS))
			) * fighter.CROUCHED_LIGHT_PUNCH_CELL_SIZE,
			fighter.CROUCHED_LIGHT_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"crouched_punch_crouched", atlas_frame)
	var impact_frame := AtlasTexture.new()
	impact_frame.atlas = fighter.CROUCHED_LIGHT_PUNCH_SHEET
	impact_frame.region = Rect2(
		Vector2(
			float(19 % fighter.CROUCHED_LIGHT_PUNCH_COLUMNS),
			float(floori(19.0 / fighter.CROUCHED_LIGHT_PUNCH_COLUMNS))
		) * fighter.CROUCHED_LIGHT_PUNCH_CELL_SIZE,
		fighter.CROUCHED_LIGHT_PUNCH_CELL_SIZE
	)
	frames.add_frame(&"crouched_punch_crouched", impact_frame)
	for source_index in range(18, -1, -2):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.CROUCHED_LIGHT_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.CROUCHED_LIGHT_PUNCH_COLUMNS),
				float(floori(float(source_index) / fighter.CROUCHED_LIGHT_PUNCH_COLUMNS))
			) * fighter.CROUCHED_LIGHT_PUNCH_CELL_SIZE,
			fighter.CROUCHED_LIGHT_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"crouched_punch_crouched", atlas_frame)


func configure_crouched_light_punch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"crouched_punch"):
		frames.remove_animation(&"crouched_punch")
	frames.add_animation(&"crouched_punch")
	frames.set_animation_speed(&"crouched_punch", 48.0)
	frames.set_animation_loop(&"crouched_punch", false)
	# Un fotogramma sì e uno no: step=2; poi frame 19 (impatto); rovesciata 18→0.
	for source_index in range(0, 19, 2):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.CROUCHED_LIGHT_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.CROUCHED_LIGHT_PUNCH_COLUMNS),
				float(floori(float(source_index) / fighter.CROUCHED_LIGHT_PUNCH_COLUMNS))
			) * fighter.CROUCHED_LIGHT_PUNCH_CELL_SIZE,
			fighter.CROUCHED_LIGHT_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"crouched_punch", atlas_frame)
	var impact_frame := AtlasTexture.new()
	impact_frame.atlas = fighter.CROUCHED_LIGHT_PUNCH_SHEET
	impact_frame.region = Rect2(
		Vector2(
			float(19 % fighter.CROUCHED_LIGHT_PUNCH_COLUMNS),
			float(floori(19.0 / fighter.CROUCHED_LIGHT_PUNCH_COLUMNS))
		) * fighter.CROUCHED_LIGHT_PUNCH_CELL_SIZE,
		fighter.CROUCHED_LIGHT_PUNCH_CELL_SIZE
	)
	frames.add_frame(&"crouched_punch", impact_frame)
	for source_index in range(18, -1, -2):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.CROUCHED_LIGHT_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.CROUCHED_LIGHT_PUNCH_COLUMNS),
				float(floori(float(source_index) / fighter.CROUCHED_LIGHT_PUNCH_COLUMNS))
			) * fighter.CROUCHED_LIGHT_PUNCH_CELL_SIZE,
			fighter.CROUCHED_LIGHT_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"crouched_punch", atlas_frame)


func configure_light_punch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"light_punch_single"):
		frames.remove_animation(&"light_punch_single")
	frames.add_animation(&"light_punch_single")
	frames.set_animation_speed(&"light_punch_single", 48.0)
	frames.set_animation_loop(&"light_punch_single", false)
	for source_index in range(fighter.LIGHT_PUNCH_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.LIGHT_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.LIGHT_PUNCH_COLUMNS),
				float(floori(float(source_index) / fighter.LIGHT_PUNCH_COLUMNS))
			) * fighter.LIGHT_PUNCH_CELL_SIZE,
			fighter.LIGHT_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"light_punch_single", atlas_frame)


func configure_crouched_medium_punch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"crouched_medium_punch"):
		frames.remove_animation(&"crouched_medium_punch")
	frames.add_animation(&"crouched_medium_punch")
	frames.set_animation_speed(&"crouched_medium_punch", 48.0)
	frames.set_animation_loop(&"crouched_medium_punch", false)
	# Avanzata: sorgente 8-22 (hitbox al 19-22); rovesciata: 21-14.
	for source_index in range(8, 23):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.CROUCHED_MEDIUM_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.CROUCHED_MEDIUM_PUNCH_COLUMNS),
				float(floori(float(source_index) / fighter.CROUCHED_MEDIUM_PUNCH_COLUMNS))
			) * fighter.CROUCHED_MEDIUM_PUNCH_CELL_SIZE,
			fighter.CROUCHED_MEDIUM_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"crouched_medium_punch", atlas_frame)
	for source_index in range(21, 13, -1):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.CROUCHED_MEDIUM_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.CROUCHED_MEDIUM_PUNCH_COLUMNS),
				float(floori(float(source_index) / fighter.CROUCHED_MEDIUM_PUNCH_COLUMNS))
			) * fighter.CROUCHED_MEDIUM_PUNCH_CELL_SIZE,
			fighter.CROUCHED_MEDIUM_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"crouched_medium_punch", atlas_frame)


func configure_crouched_medium_punch_crouched_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"crouched_medium_punch_crouched"):
		frames.remove_animation(&"crouched_medium_punch_crouched")
	frames.add_animation(&"crouched_medium_punch_crouched")
	frames.set_animation_speed(&"crouched_medium_punch_crouched", 48.0)
	frames.set_animation_loop(&"crouched_medium_punch_crouched", false)
	# Parte da sorgente 12 (già in carica); stessa rovesciata fino a 8.
	for source_index in range(12, 23):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.CROUCHED_MEDIUM_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.CROUCHED_MEDIUM_PUNCH_COLUMNS),
				float(floori(float(source_index) / fighter.CROUCHED_MEDIUM_PUNCH_COLUMNS))
			) * fighter.CROUCHED_MEDIUM_PUNCH_CELL_SIZE,
			fighter.CROUCHED_MEDIUM_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"crouched_medium_punch_crouched", atlas_frame)
	for source_index in range(21, 13, -1):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.CROUCHED_MEDIUM_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.CROUCHED_MEDIUM_PUNCH_COLUMNS),
				float(floori(float(source_index) / fighter.CROUCHED_MEDIUM_PUNCH_COLUMNS))
			) * fighter.CROUCHED_MEDIUM_PUNCH_CELL_SIZE,
			fighter.CROUCHED_MEDIUM_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"crouched_medium_punch_crouched", atlas_frame)


func configure_medium_punch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"medium_open_hand_slap"):
		frames.remove_animation(&"medium_open_hand_slap")
	frames.add_animation(&"medium_open_hand_slap")
	frames.set_animation_speed(&"medium_open_hand_slap", 48.0)
	frames.set_animation_loop(&"medium_open_hand_slap", false)
	
	# Add preparation frames (10 frames)
	for source_index in range(fighter.MEDIUM_PUNCH_PREPARATION_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.MEDIUM_PUNCH_PREPARATION_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.MEDIUM_PUNCH_COLUMNS),
				float(floori(float(source_index) / float(fighter.MEDIUM_PUNCH_COLUMNS)))
			) * fighter.MEDIUM_PUNCH_CELL_SIZE,
			fighter.MEDIUM_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"medium_open_hand_slap", atlas_frame)
	
	# Add hit frames (16 frames)
	for source_index in range(fighter.MEDIUM_PUNCH_HIT_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.MEDIUM_PUNCH_HIT_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.MEDIUM_PUNCH_COLUMNS),
				float(floori(float(source_index) / float(fighter.MEDIUM_PUNCH_COLUMNS)))
			) * fighter.MEDIUM_PUNCH_CELL_SIZE,
			fighter.MEDIUM_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"medium_open_hand_slap", atlas_frame)
	
	# Add to-idle frames (16 frames)
	for source_index in range(fighter.MEDIUM_PUNCH_TO_IDLE_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.MEDIUM_PUNCH_TO_IDLE_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.MEDIUM_PUNCH_COLUMNS),
				float(floori(float(source_index) / float(fighter.MEDIUM_PUNCH_COLUMNS)))
			) * fighter.MEDIUM_PUNCH_CELL_SIZE,
			fighter.MEDIUM_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"medium_open_hand_slap", atlas_frame)


func configure_jump_medium_punch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"jump_medium_punch"):
		frames.remove_animation(&"jump_medium_punch")
	frames.add_animation(&"jump_medium_punch")
	frames.set_animation_speed(&"jump_medium_punch", 48.0)
	frames.set_animation_loop(&"jump_medium_punch", false)
	for source_index in fighter.JUMP_MEDIUM_PUNCH_SOURCE_SEQUENCE:
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.JUMP_MEDIUM_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.JUMP_MEDIUM_PUNCH_COLUMNS),
				float(floori(float(source_index) / fighter.JUMP_MEDIUM_PUNCH_COLUMNS))
			) * fighter.JUMP_MEDIUM_PUNCH_CELL_SIZE,
			fighter.JUMP_MEDIUM_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"jump_medium_punch", atlas_frame)


func configure_jump_heavy_punch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"jump_heavy_punch"):
		frames.remove_animation(&"jump_heavy_punch")
	frames.add_animation(&"jump_heavy_punch")
	frames.set_animation_speed(&"jump_heavy_punch", 48.0)
	frames.set_animation_loop(&"jump_heavy_punch", false)
	for source_index in range(fighter.JUMP_HEAVY_PUNCH_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.JUMP_HEAVY_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.JUMP_HEAVY_PUNCH_COLUMNS),
				float(floori(float(source_index) / fighter.JUMP_HEAVY_PUNCH_COLUMNS))
			) * fighter.JUMP_HEAVY_PUNCH_CELL_SIZE,
			fighter.JUMP_HEAVY_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"jump_heavy_punch", atlas_frame)
	for source_index in range(fighter.JUMP_HEAVY_PUNCH_FRAME_COUNT - 2, -1, -1):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.JUMP_HEAVY_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.JUMP_HEAVY_PUNCH_COLUMNS),
				float(floori(float(source_index) / fighter.JUMP_HEAVY_PUNCH_COLUMNS))
			) * fighter.JUMP_HEAVY_PUNCH_CELL_SIZE,
			fighter.JUMP_HEAVY_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"jump_heavy_punch", atlas_frame)


func configure_special_720_punch_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"special_720_punch"):
		frames.remove_animation(&"special_720_punch")
	frames.add_animation(&"special_720_punch")
	frames.set_animation_speed(&"special_720_punch", 48.0)
	frames.set_animation_loop(&"special_720_punch", false)
	for source_index in range(fighter.SPECIAL_720_PUNCH_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.SPECIAL_720_PUNCH_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.SPECIAL_720_PUNCH_COLUMNS),
				float(floori(float(source_index) / fighter.SPECIAL_720_PUNCH_COLUMNS))
			) * fighter.SPECIAL_720_PUNCH_CELL_SIZE,
			fighter.SPECIAL_720_PUNCH_CELL_SIZE
		)
		frames.add_frame(&"special_720_punch", atlas_frame)


func configure_special_sonic_boom_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"special_sonic_boom"):
		frames.remove_animation(&"special_sonic_boom")
	frames.add_animation(&"special_sonic_boom")
	frames.set_animation_speed(&"special_sonic_boom", 48.0)
	frames.set_animation_loop(&"special_sonic_boom", false)
	for source_index in range(fighter.SPECIAL_SONIC_BOOM_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.SPECIAL_SONIC_BOOM_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.SPECIAL_SONIC_BOOM_COLUMNS),
				float(floori(float(source_index) / fighter.SPECIAL_SONIC_BOOM_COLUMNS))
			) * fighter.SPECIAL_SONIC_BOOM_CELL_SIZE,
			fighter.SPECIAL_SONIC_BOOM_CELL_SIZE
		)
		frames.add_frame(&"special_sonic_boom", atlas_frame)


func configure_grab_tentative_frames() -> void:
	var frames := animated_sprite.sprite_frames
	for animation_name: StringName in [&"grab_tentative", &"grab_tentative_recovery"]:
		if frames.has_animation(animation_name):
			frames.remove_animation(animation_name)
		frames.add_animation(animation_name)
		frames.set_animation_speed(animation_name, 60.0)
		frames.set_animation_loop(animation_name, false)
	for source_index in range(fighter.GRAB_TENTATIVE_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.GRAB_TENTATIVE_REAR_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.GRAB_TENTATIVE_COLUMNS),
				float(floori(float(source_index) / fighter.GRAB_TENTATIVE_COLUMNS))
			) * fighter.GRAB_TENTATIVE_CELL_SIZE,
			fighter.GRAB_TENTATIVE_CELL_SIZE
		)
		frames.add_frame(&"grab_tentative", atlas_frame)
	for source_index in range(fighter.GRAB_TENTATIVE_FRAME_COUNT - 2, -1, -1):
		frames.add_frame(
			&"grab_tentative_recovery",
			frames.get_frame_texture(&"grab_tentative", source_index)
		)
	var front_frames := SpriteFrames.new()
	front_frames.add_animation(&"grab_tentative_front")
	front_frames.set_animation_speed(&"grab_tentative_front", 60.0)
	front_frames.set_animation_loop(&"grab_tentative_front", false)
	for source_index in range(fighter.GRAB_TENTATIVE_FRAME_COUNT):
		var front_atlas_frame := AtlasTexture.new()
		front_atlas_frame.atlas = fighter.GRAB_TENTATIVE_FRONT_SHEET
		front_atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.GRAB_TENTATIVE_COLUMNS),
				float(floori(float(source_index) / fighter.GRAB_TENTATIVE_COLUMNS))
			) * fighter.GRAB_TENTATIVE_CELL_SIZE,
			fighter.GRAB_TENTATIVE_CELL_SIZE
		)
		front_frames.add_frame(&"grab_tentative_front", front_atlas_frame)
	grab_front_sprite.sprite_frames = front_frames
	grab_front_sprite.animation = &"grab_tentative_front"


func configure_grab_headbutt_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"grab_headbutt"):
		frames.remove_animation(&"grab_headbutt")
	frames.add_animation(&"grab_headbutt")
	frames.set_animation_speed(&"grab_headbutt", 25.0)
	frames.set_animation_loop(&"grab_headbutt", false)
	for source_index in range(fighter.GRAB_HEADBUTT_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.GRAB_HEADBUTT_REAR_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.GRAB_HEADBUTT_COLUMNS),
				float(floori(float(source_index) / fighter.GRAB_HEADBUTT_COLUMNS))
			) * fighter.GRAB_HEADBUTT_CELL_SIZE,
			fighter.GRAB_HEADBUTT_CELL_SIZE
		)
		frames.add_frame(&"grab_headbutt", atlas_frame)
	var front_frames := grab_front_sprite.sprite_frames
	if front_frames.has_animation(&"grab_headbutt_front"):
		front_frames.remove_animation(&"grab_headbutt_front")
	front_frames.add_animation(&"grab_headbutt_front")
	front_frames.set_animation_speed(&"grab_headbutt_front", 25.0)
	front_frames.set_animation_loop(&"grab_headbutt_front", false)
	for source_index in range(fighter.GRAB_HEADBUTT_FRAME_COUNT):
		var front_atlas_frame := AtlasTexture.new()
		front_atlas_frame.atlas = fighter.GRAB_HEADBUTT_FRONT_SHEET
		front_atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.GRAB_HEADBUTT_COLUMNS),
				float(floori(float(source_index) / fighter.GRAB_HEADBUTT_COLUMNS))
			) * fighter.GRAB_HEADBUTT_CELL_SIZE,
			fighter.GRAB_HEADBUTT_CELL_SIZE
		)
		front_frames.add_frame(&"grab_headbutt_front", front_atlas_frame)


func configure_grab_headbow_combined_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"grab_headbow_combined"):
		frames.remove_animation(&"grab_headbow_combined")
	frames.add_animation(&"grab_headbow_combined")
	frames.set_animation_speed(&"grab_headbow_combined", 48.0)
	frames.set_animation_loop(&"grab_headbow_combined", false)
	for source_index in range(fighter.GRAB_HEADBOW_COMBINED_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.GRAB_HEADBOW_COMBINED_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.GRAB_HEADBOW_COMBINED_COLUMNS),
				float(floori(float(source_index) / fighter.GRAB_HEADBOW_COMBINED_COLUMNS))
			) * fighter.GRAB_HEADBOW_COMBINED_CELL_SIZE,
			fighter.GRAB_HEADBOW_COMBINED_CELL_SIZE
		)
		frames.add_frame(&"grab_headbow_combined", atlas_frame)


func configure_super_start_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"super_start"):
		frames.remove_animation(&"super_start")
	frames.add_animation(&"super_start")
	frames.set_animation_speed(&"super_start", 48.0)
	frames.set_animation_loop(&"super_start", false)
	for source_index in range(fighter.SUPER_START_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.SUPER_START_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.SUPER_START_COLUMNS),
				float(floori(float(source_index) / fighter.SUPER_START_COLUMNS))
			) * fighter.SUPER_START_CELL_SIZE,
			fighter.SUPER_START_CELL_SIZE
		)
		frames.add_frame(&"super_start", atlas_frame)


func configure_super_rotate_run_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"super_rotate_run"):
		frames.remove_animation(&"super_rotate_run")
	frames.add_animation(&"super_rotate_run")
	frames.set_animation_speed(&"super_rotate_run", 48.0)
	frames.set_animation_loop(&"super_rotate_run", false)
	for source_index in range(fighter.SUPER_ROTATE_RUN_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.SUPER_ROTATE_RUN_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.SUPER_ROTATE_RUN_COLUMNS),
				float(floori(float(source_index) / fighter.SUPER_ROTATE_RUN_COLUMNS))
			) * fighter.SUPER_ROTATE_RUN_CELL_SIZE,
			fighter.SUPER_ROTATE_RUN_CELL_SIZE
		)
		frames.add_frame(&"super_rotate_run", atlas_frame)


func configure_super_run_only_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"super_run_only"):
		frames.remove_animation(&"super_run_only")
	frames.add_animation(&"super_run_only")
	frames.set_animation_speed(&"super_run_only", 48.0)
	frames.set_animation_loop(&"super_run_only", true)
	for source_index in range(fighter.SUPER_RUN_ONLY_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.SUPER_RUN_ONLY_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.SUPER_RUN_ONLY_COLUMNS),
				float(floori(float(source_index) / fighter.SUPER_RUN_ONLY_COLUMNS))
			) * fighter.SUPER_RUN_ONLY_CELL_SIZE,
			fighter.SUPER_RUN_ONLY_CELL_SIZE
		)
		frames.add_frame(&"super_run_only", atlas_frame)


func configure_super_drum_roll_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"super_drum_roll"):
		frames.remove_animation(&"super_drum_roll")
	frames.add_animation(&"super_drum_roll")
	frames.set_animation_speed(&"super_drum_roll", 48.0)
	frames.set_animation_loop(&"super_drum_roll", false)
	for source_index in range(fighter.SUPER_DRUM_ROLL_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.SUPER_DRUM_ROLL_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.SUPER_DRUM_ROLL_COLUMNS),
				float(floori(float(source_index) / fighter.SUPER_DRUM_ROLL_COLUMNS))
			) * fighter.SUPER_DRUM_ROLL_CELL_SIZE,
			fighter.SUPER_DRUM_ROLL_CELL_SIZE
		)
		frames.add_frame(&"super_drum_roll", atlas_frame)


func configure_super_drum_hurt_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"super_drum_hurt"):
		frames.remove_animation(&"super_drum_hurt")
	frames.add_animation(&"super_drum_hurt")
	frames.set_animation_speed(&"super_drum_hurt", 48.0)
	frames.set_animation_loop(&"super_drum_hurt", true)
	for source_index in range(
		fighter.SUPER_DRUM_HURT_SOURCE_START_FRAME,
		fighter.SUPER_DRUM_HURT_SOURCE_END_FRAME + 1
	):
		frames.add_frame(
			&"super_drum_hurt",
			frames.get_frame_texture(&"hurt_high", source_index)
		)


func configure_super_drum_knockdown_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"super_drum_knockdown"):
		frames.remove_animation(&"super_drum_knockdown")
	frames.add_animation(&"super_drum_knockdown")
	frames.set_animation_speed(&"super_drum_knockdown", 24.0)
	frames.set_animation_loop(&"super_drum_knockdown", false)
	for source_index in range(
		fighter.SUPER_DRUM_KNOCKDOWN_SOURCE_START_FRAME,
		fighter.SUPER_DRUM_KNOCKDOWN_SOURCE_END_FRAME + 1
	):
		frames.add_frame(
			&"super_drum_knockdown",
			frames.get_frame_texture(&"ko", source_index)
		)


func configure_grabbed_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"grabbed"):
		frames.remove_animation(&"grabbed")
	frames.add_animation(&"grabbed")
	frames.set_animation_speed(&"grabbed", 24.0)
	frames.set_animation_loop(&"grabbed", false)
	for source_index in range(fighter.GRABBED_START_FRAME, fighter.GRABBED_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.GRABBED_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.GRABBED_COLUMNS),
				float(floori(float(source_index) / fighter.GRABBED_COLUMNS))
			) * fighter.GRABBED_CELL_SIZE,
			fighter.GRABBED_CELL_SIZE
		)
		frames.add_frame(&"grabbed", atlas_frame)
	for source_index in range(fighter.GRABBED_FRAME_COUNT - 1, fighter.GRABBED_START_FRAME - 1, -1):
		frames.add_frame(
			&"grabbed",
			frames.get_frame_texture(&"grabbed", source_index - fighter.GRABBED_START_FRAME)
		)


func configure_hurted_in_jump_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"hurted_in_jump"):
		frames.remove_animation(&"hurted_in_jump")
	frames.add_animation(&"hurted_in_jump")
	frames.set_animation_speed(&"hurted_in_jump", 24.0)
	frames.set_animation_loop(&"hurted_in_jump", false)
	for source_index in range(fighter.HURTED_IN_JUMP_FRAME_COUNT):
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.HURTED_IN_JUMP_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.HURTED_IN_JUMP_COLUMNS),
				float(floori(float(source_index) / fighter.HURTED_IN_JUMP_COLUMNS))
			) * fighter.HURTED_IN_JUMP_CELL_SIZE,
			fighter.HURTED_IN_JUMP_CELL_SIZE
		)
		frames.add_frame(&"hurted_in_jump", atlas_frame)


func configure_victory_frames() -> void:
	var frames := animated_sprite.sprite_frames
	if frames.has_animation(&"victory"):
		frames.remove_animation(&"victory")
	frames.add_animation(&"victory")
	frames.set_animation_speed(&"victory", 24.0)
	frames.set_animation_loop(&"victory", false)
	for source_index in range(fighter.VICTORY_FRAME_COUNT):
		# Salta i frame 8, 9, 10, 11
		if source_index in [8, 9, 10, 11]:
			continue
		var atlas_frame := AtlasTexture.new()
		atlas_frame.atlas = fighter.VICTORY_SHEET
		atlas_frame.region = Rect2(
			Vector2(
				float(source_index % fighter.VICTORY_COLUMNS),
				float(floori(float(source_index) / fighter.VICTORY_COLUMNS))
			) * fighter.VICTORY_CELL_SIZE,
			fighter.VICTORY_CELL_SIZE
		)
		frames.add_frame(&"victory", atlas_frame)
