extends SceneTree
func _initialize() -> void:
    call_deferred("run")
func snapshot(frames: SpriteFrames) -> Array:
    var result: Array = []
    for animation in frames.get_animation_names():
        if frames.get_frame_count(animation)==0: continue
        var cells: Array = []
        for i in frames.get_frame_count(animation):
            var texture: AtlasTexture = frames.get_frame_texture(animation,i)
            var r: Rect2 = texture.region
            cells.append({"sourcePath":texture.atlas.get_meta("source_path"), "rect":[r.position.x,r.position.y,r.size.x,r.size.y], "weight":frames.get_frame_duration(animation,i)})
        result.append({"animation":str(animation),"fps":frames.get_animation_speed(animation),"loop":frames.get_animation_loop(animation),"cells":cells})
    return result
func run() -> void:
    var who: String = OS.get_cmdline_user_args()[0]
    var config: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://"+who+".json"))
    var owner_node = load("res://Owner.gd").new()
    owner_node.values=config.values
    owner_node.source=config.source
    var sprite := AnimatedSprite2D.new()
    sprite.name="AnimatedSprite2D"
    owner_node.add_child(sprite)
    var front := AnimatedSprite2D.new()
    front.name="GrabFrontSprite"
    owner_node.add_child(front)
    root.add_child(owner_node)
    var script = load("res://"+who+"Catalog.gd")
    if script == null or not script.can_instantiate():
        quit(1)
        return
    var catalog = script.new(owner_node)
    var output: Array = []
    for function in config.functions:
        sprite.sprite_frames=SpriteFrames.new()
        front.sprite_frames=SpriteFrames.new()
        catalog.call(function)
        output.append({"function":function,"animations":snapshot(sprite.sprite_frames),"front":snapshot(front.sprite_frames)})
        sprite.sprite_frames=null
        front.sprite_frames=null
        owner_node.textures.clear()
    var file := FileAccess.open("res://"+who+"-runtime.json",FileAccess.WRITE)
    file.store_string(JSON.stringify(output,"  "))
    quit()
