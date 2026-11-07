extends Node
var values: Dictionary
var source: String
var textures: Dictionary = {}
func get_texture(path: String) -> Texture2D:
    if not textures.has(path):
        var img := Image.load_from_file(source+"/"+path)
        assert(img != null, path)
        var texture := ImageTexture.create_from_image(img)
        texture.set_meta("source_path", path)
        textures[path] = texture
    return textures[path]
func _get(key: StringName) -> Variant:
    assert(values.has(key), "Costante mancante: "+str(key))
    var value: Variant = values.get(key)
    if value is Dictionary:
        if value.has("vector"): return Vector2(value.vector[0],value.vector[1])
        if value.has("texture"): return get_texture(value.texture)
    if value is float and value == floor(value): return int(value)
    if value is Array:
        return value.map(func(v): return int(v) if v is float and v == floor(v) else v)
    return value
