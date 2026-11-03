(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MovesGroups = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function group(characters) {
    const groups = new Map();
    for (const character of characters) {
      for (const animation of character.animations) {
        if (!groups.has(animation.id)) groups.set(animation.id, {id:animation.id, name:animation.name, animations:[]});
        groups.get(animation.id).animations.push({...animation, characterId:character.id, characterName:character.name});
      }
    }
    return [...groups.values()];
  }
  function filter(group, query) {
    const text = query.trim().toLocaleLowerCase('it');
    return {...group, animations:group.animations.filter(a=>a.characterName.toLocaleLowerCase('it').includes(text))};
  }
  return Object.freeze({group, filter});
});
