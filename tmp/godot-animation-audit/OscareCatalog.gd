extends RefCounted
var fighter: Node
var animated_sprite: AnimatedSprite2D
func _init(owner: Node):
    fighter=owner
    animated_sprite=owner.get_node("AnimatedSprite2D")
func _configure_animations() -> void:
    var frames := SpriteFrames.new()
    if fighter.victory_sheet != null:
        _add_sheet_animation(frames, &"victory", fighter.victory_sheet, fighter.victory_frame_count, fighter.victory_columns, Vector2(512,512), fighter.VICTORY_FPS, false, 0, false)
    frames.remove_animation(&"default")
    if fighter.low_strong_punch_sheet != null:
        _add_sheet_animation(frames, &"crouched_strong_punch", fighter.low_strong_punch_sheet, fighter.low_strong_punch_frame_count, fighter.low_strong_punch_columns, Vector2(512.0, 512.0), fighter.low_strong_punch_fps, false, 0, false)
    if fighter.low_medium_punch_sheet != null:
        _add_sheet_animation(frames, &"crouched_medium_punch", fighter.low_medium_punch_sheet, fighter.low_medium_punch_frame_count, fighter.low_medium_punch_columns, Vector2(512.0, 512.0), fighter.low_medium_punch_fps, false, 0, false)
    if fighter.medium_kick_sheet != null:
        _add_sheet_animation(frames, &"medium_kick", fighter.medium_kick_sheet, fighter.medium_kick_frame_count, fighter.medium_kick_columns, Vector2(512.0, 512.0), fighter.medium_kick_fps, false, 0, false)
    if fighter.low_medium_kick_sheet != null:
        _add_sheet_animation(frames, &"crouched_medium_kick", fighter.low_medium_kick_sheet, fighter.low_medium_kick_frame_count, fighter.low_medium_kick_columns, Vector2(512.0, 512.0), fighter.low_medium_kick_fps, false, 0, false)
        if fighter.low_medium_kick_reverse:
            _add_sheet_animation(frames, &"crouched_medium_kick_recovery", fighter.low_medium_kick_sheet, fighter.low_medium_kick_frame_count - 1, fighter.low_medium_kick_columns, Vector2(512.0, 512.0), fighter.low_medium_kick_fps, true, 0, false)
    if fighter.light_kick_sheet != null:
        _add_sheet_animation(frames, &"light_kick", fighter.light_kick_sheet, fighter.light_kick_frame_count, fighter.light_kick_columns, Vector2(512.0, 512.0), fighter.light_kick_fps, false, 0, false)
    if fighter.strong_kick_sheet != null:
        _add_sheet_animation(frames, &"strong_kick", fighter.strong_kick_sheet, fighter.strong_kick_frame_count, fighter.strong_kick_columns, Vector2(512.0, 512.0), fighter.strong_kick_fps, false, 0, false)
    if fighter.low_strong_kick_sheet != null:
        _add_sheet_animation(frames, &"crouched_strong_kick", fighter.low_strong_kick_sheet, fighter.low_strong_kick_frame_count, fighter.low_strong_kick_columns, Vector2(512.0, 512.0), fighter.low_strong_kick_fps, false, 0, false)
    if fighter.low_light_kick_sheet != null:
        _add_sheet_animation(frames, &"crouched_light_kick", fighter.low_light_kick_sheet, fighter.low_light_kick_frame_count, fighter.low_light_kick_columns, Vector2(512.0, 512.0), fighter.low_light_kick_fps, false, 0, false)
        if fighter.low_light_kick_reverse:
            _add_sheet_animation(frames, &"crouched_light_kick_recovery", fighter.low_light_kick_sheet, fighter.low_light_kick_frame_count - 1, fighter.low_light_kick_columns, Vector2(512.0, 512.0), fighter.low_light_kick_fps, true, 0, false)
    if fighter.low_light_punch_sheet != null:
        _add_sheet_animation(frames, &"crouched_light_punch", fighter.low_light_punch_sheet, fighter.low_light_punch_frame_count, fighter.low_light_punch_columns, Vector2(512.0, 512.0), 24.0, false, 0, false)
    if fighter.strong_punch_sheet != null:
        _add_sheet_animation(frames, &"strong_punch", fighter.strong_punch_sheet, fighter.strong_punch_frame_count, fighter.strong_punch_columns, Vector2(512.0, 512.0), fighter.strong_punch_fps, false, 0, false)
    if fighter.medium_punch_sheet != null:
        _add_sheet_animation(frames, &"medium_punch", fighter.medium_punch_sheet, fighter.medium_punch_frame_count, fighter.medium_punch_columns, Vector2(512.0, 512.0), fighter.medium_punch_fps, false, 0, false)
        if fighter.medium_punch_reverse_fps > 0.0:
            _add_sheet_animation(frames, &"medium_punch_recovery", fighter.medium_punch_sheet, fighter.medium_punch_frame_count - 1, fighter.medium_punch_columns, Vector2(512.0, 512.0), fighter.medium_punch_reverse_fps, true, 0, false)
    if fighter.light_punch_sheet != null:
        _add_sheet_animation(frames, &"light_punch", fighter.light_punch_sheet, 7, 5, Vector2(512.0, 512.0), 24.0, false, 0, false)
        for source_index in range(5, -1, -1):
            var texture := AtlasTexture.new()
            texture.atlas = fighter.light_punch_sheet
            texture.region = Rect2(Vector2(source_index % 5, source_index / 5) * 512.0, Vector2(512.0, 512.0))
            frames.add_frame(&"light_punch", texture)
    if fighter.jump_medium_kick_sheet != null:
        _add_sheet_animation(frames, &"jump_medium_kick", fighter.jump_medium_kick_sheet, fighter.jump_medium_kick_frame_count, fighter.jump_medium_kick_columns, Vector2(512.0, 512.0), fighter.jump_medium_kick_fps, false, 0, false)
    if fighter.jump_strong_kick_sheet != null:
        _add_sheet_animation(frames, &"jump_strong_kick", fighter.jump_strong_kick_sheet, fighter.jump_strong_kick_frame_count, fighter.jump_strong_kick_columns, Vector2(512.0, 512.0), fighter.jump_strong_kick_fps, false, 0, false)
    if fighter.jump_light_kick_sheet != null:
        _add_sheet_animation(frames, &"jump_light_kick", fighter.jump_light_kick_sheet, fighter.jump_light_kick_frame_count, fighter.jump_light_kick_columns, Vector2(512.0, 512.0), fighter.jump_light_kick_fps, false, 0, false)
    if fighter.jump_medium_punch_sheet != null:
        _add_sheet_animation(frames, &"jump_medium_punch", fighter.jump_medium_punch_sheet, fighter.jump_medium_punch_frame_count, fighter.jump_medium_punch_columns, Vector2(512.0, 512.0), fighter.jump_medium_punch_fps, false, 0, false)
    if fighter.jump_strong_punch_sheet != null:
        _add_sheet_animation(frames, &"jump_strong_punch", fighter.jump_strong_punch_sheet, fighter.jump_strong_punch_frame_count, fighter.jump_strong_punch_columns, Vector2(512.0, 512.0), fighter.jump_strong_punch_fps, false, 0, false)
    if fighter.jump_light_punch_sheet != null:
        _add_sheet_animation(frames, &"jump_light_punch", fighter.jump_light_punch_sheet, fighter.jump_light_punch_frame_count, fighter.jump_light_punch_columns, Vector2(512.0, 512.0), 24.0, false, 0, false)
        _add_sheet_animation(frames, &"jump_pose", fighter.jump_light_punch_sheet, 1, fighter.jump_light_punch_columns, Vector2(512.0, 512.0), 24.0, false, 0, false)
    _add_sheet_animation(frames, &"idle", fighter.idle_sheet, fighter.idle_frame_count, fighter.idle_columns, fighter.idle_cell_size, fighter.IDLE_FPS)
    if fighter.walk_sheet != null:
        _add_sheet_animation(frames, &"walk", fighter.walk_sheet, fighter.walk_frame_count, fighter.walk_columns, fighter.walk_cell_size, fighter.WALK_FPS)
        _add_sheet_animation(frames, &"backwalk", fighter.walk_sheet, fighter.walk_frame_count, fighter.walk_columns, fighter.walk_cell_size, fighter.WALK_FPS, true)
    if fighter.run_sheet != null:
        _add_sheet_animation(frames, &"run", fighter.run_sheet, fighter.run_frame_count, fighter.run_columns, fighter.run_cell_size, fighter.RUN_FPS)
    if fighter.back_jump_sheet != null:
        _add_sheet_animation(frames, &"back_jump", fighter.back_jump_sheet, 20, 5, Vector2(512.0, 512.0), 24.0, false, 0, false)
    if fighter.crouch_sheet != null:
        _add_sheet_animation(frames, &"crouch", fighter.crouch_sheet, fighter.crouch_frame_count, fighter.crouch_columns, fighter.crouch_cell_size, fighter.CROUCH_FPS, false, 0, false)
    if fighter.jump_sheet != null and fighter.jump_idle_frame > fighter.jump_start_frame and fighter.jump_start_frame > 0:
        _add_sheet_animation(
            frames, &"jump", fighter.jump_sheet,
            fighter.jump_idle_frame - fighter.jump_start_frame,
            fighter.jump_columns, fighter.jump_cell_size, fighter.JUMP_FPS,
            false, fighter.jump_start_frame - 1, false
        )
    if fighter.block_sheet != null:
        _add_sheet_animation(frames, &"block_high", fighter.block_sheet, fighter.block_frame_count, fighter.block_columns, fighter.block_cell_size, fighter.BLOCK_FPS, false, 0, false)
        _add_sheet_animation(frames, &"block_high_recovery", fighter.block_sheet, fighter.block_frame_count, fighter.block_columns, fighter.block_cell_size, fighter.BLOCK_FPS, true, 0, false)
    if fighter.block_low_sheet != null:
        _add_sheet_animation(frames, &"block_low", fighter.block_low_sheet, fighter.block_low_frame_count, fighter.block_low_columns, fighter.block_low_cell_size, fighter.BLOCK_LOW_FPS, false, 0, false)
        _add_sheet_animation(frames, &"block_low_recovery", fighter.block_low_sheet, fighter.block_low_frame_count, fighter.block_low_columns, fighter.block_low_cell_size, fighter.BLOCK_LOW_FPS, true, 0, false)
    if fighter.block_medium_sheet != null:
        _add_sheet_animation(frames, &"block_mid", fighter.block_medium_sheet, 6, 5, Vector2(512.0, 512.0), 24.0, false, 0, false)
        _add_sheet_animation(frames, &"block_mid_recovery", fighter.block_medium_sheet, 5, 5, Vector2(512.0, 512.0), 24.0, true, 0, false)
    if fighter.hurt_high_sheet != null:
        _add_sheet_animation(frames, &"hurt_high", fighter.hurt_high_sheet, fighter.hurt_high_frame_count, fighter.hurt_high_columns, fighter.hurt_high_cell_size, fighter.HURT_FPS, false, 0, false)
        if fighter.hurt_high_has_reverse and fighter.hurt_high_frame_count > 1:
            _add_sheet_animation(frames, &"hurt_high_reverse", fighter.hurt_high_sheet, fighter.hurt_high_frame_count - 1, fighter.hurt_high_columns, fighter.hurt_high_cell_size, fighter.HURT_FPS, true, 0, false)
    if fighter.hurt_medium_sheet != null:
        _add_sheet_animation(frames, &"hurt_mid", fighter.hurt_medium_sheet, fighter.hurt_medium_frame_count, fighter.hurt_medium_columns, fighter.hurt_medium_cell_size, fighter.HURT_FPS, false, 0, false)
        if fighter.hurt_medium_frame_count > 1:
            _add_sheet_animation(frames, &"hurt_mid_reverse", fighter.hurt_medium_sheet, fighter.hurt_medium_frame_count - 1, fighter.hurt_medium_columns, fighter.hurt_medium_cell_size, fighter.HURT_FPS, true, 0, false)
    if fighter.hurt_low_sheet != null:
        _add_sheet_animation(frames, &"hurt_low", fighter.hurt_low_sheet, 11, 5, Vector2(512.0, 512.0), fighter.HURT_FPS, false, 0, false)
        _add_sheet_animation(frames, &"hurt_low_reverse", fighter.hurt_low_sheet, 10, 5, Vector2(512.0, 512.0), fighter.HURT_FPS, true, 0, false)
    if fighter.death_sheet != null:
        _add_sheet_animation(frames, &"ko", fighter.death_sheet, 49, 7, Vector2(512.0, 512.0), fighter.KO_FPS, false, 0, false)
    if fighter.fall_sheet != null:
        _add_sheet_animation(frames, &"hurted_in_jump", fighter.fall_sheet, 20, 7, Vector2(512.0, 512.0), fighter.KNOCKDOWN_FPS, false, 0, false)
    if fighter.sweep_knockdown_sheet != null:
        _add_sheet_animation(frames, &"sweep_knockdown", fighter.sweep_knockdown_sheet, 42, 7, Vector2(512.0, 512.0), fighter.KNOCKDOWN_FPS, false, 0, false)
    if fighter.knockdown_recovery_sheet != null:
        _add_sheet_animation(frames, &"knockdown_recovery", fighter.knockdown_recovery_sheet, 17, fighter.knockdown_recovery_columns, Vector2(512.0, 512.0), fighter.KNOCKDOWN_FPS, false, 0, false)
    animated_sprite.sprite_frames = frames
    animated_sprite.animation = &"idle"


func _add_sheet_animation(
    frames: SpriteFrames,
    animation_name: StringName,
    sheet: Texture2D,
    frame_count: int,
    columns: int,
    cell_size: Vector2,
    fps: float,
    reverse := false,
    src_start := 0,
    loop := true
) -> void:
    frames.add_animation(animation_name)
    frames.set_animation_speed(animation_name, fps)
    frames.set_animation_loop(animation_name, loop)
    for frame_index in frame_count:
        var source_index := src_start + (frame_count - 1 - frame_index if reverse else frame_index)
        var texture := AtlasTexture.new()
        texture.atlas = sheet
        texture.region = Rect2(
            float(source_index % columns) * cell_size.x,
            float(source_index / columns) * cell_size.y,
            cell_size.x,
            cell_size.y
        )
        frames.add_frame(animation_name, texture)
