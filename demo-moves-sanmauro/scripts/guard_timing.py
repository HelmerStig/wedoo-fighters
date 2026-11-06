"""Durata uniforme delle parate, conservando i timing sorgenti Godot."""


def apply_guard_timing(data, config):
    ids = ['block-high','block-mid','block-low']
    if config.get('schema')!='sanmauro.guard-timing' or config.get('version')!=1 or config.get('animationIds')!=ids:
        raise ValueError('Configurazione timing parate non valida')
    duration = config.get('durationMs')
    if not isinstance(duration,(int,float)) or isinstance(duration,bool) or not 0 < duration <= 10000:
        raise ValueError('Durata parate non valida')
    for character in data['characters']:
        for ident in ids:
            animation = next(a for a in character['animations'] if a['id']==ident)
            count = len(animation['frames'])
            if not count:
                raise ValueError('Parata senza frame')
            if 'sourceFrameDurations' not in animation:
                animation['sourceFrameDurations'] = animation.get('frameDurations',[1000/animation['sourceFps']]*count)
                animation['sourceDurationMs'] = sum(animation['sourceFrameDurations'])
            animation.update(frameDurations=[duration/count]*count,durationMs=duration,
                guardDurationMs=duration,playbackFps=count*1000/duration)
