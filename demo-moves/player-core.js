(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MovesCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function advance(state, deltaMs, fps, frameCount, loop) {
    if (!Number.isInteger(frameCount) || frameCount < 1 || !Number.isFinite(fps) || fps <= 0) throw new Error('Animazione non valida');
    const duration = 1000 / fps;
    const elapsed = state.remainder + Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0);
    const steps = Math.floor(elapsed / duration);
    const next = state.frame + steps;
    return {frame: loop ? next % frameCount : Math.min(next, frameCount - 1), remainder: elapsed - steps * duration, ended: !loop && next >= frameCount - 1};
  }
  function effectiveFps(animation, multiplier) {
    return (animation?.playbackFps ?? 18) * multiplier;
  }
  return Object.freeze({advance, effectiveFps});
});
