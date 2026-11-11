import {readFile, readdir, writeFile, access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const demo = new URL('../', import.meta.url);
const folder = new URL('../../PNG/natale/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('roster-generation.json', folder), 'utf8'));
const files = (await readdir(folder)).filter(name => /\.png$/i.test(name));
const themes = {'babbo-natale':'Babbo Natale', elfo:'Elfo', maglione:'Maglione natalizio', renna:'Renna', albero:'Albero di Natale', 'pan-di-zenzero':'Pan di zenzero', 'pupazzo-di-neve':'Pupazzo di neve bianco'};
const excluded = new Set(manifest.excluded.map(name => name.toLowerCase()));
const characters = [];
for (const item of [...manifest.reused, ...manifest.jobs]) {
  if (excluded.has(item.name.toLowerCase())) continue;
  const filename = files.find(name => name.toLowerCase() === `${item.name}-natale.png`.toLowerCase());
  if (!filename || !themes[item.theme]) throw new Error(`Versione natalizia mancante o tema non valido: ${item.name}`);
  await access(new URL(filename, folder));
  characters.push({id:item.name.toLowerCase(), name:item.name === 'OSCARE' ? 'Oscar' : item.name === 'TONY-ok' ? 'Tony' : item.name.replaceAll('-', ' '), theme:item.theme, themeName:themes[item.theme], image:`../PNG/natale/${encodeURIComponent(filename)}`});
}
characters.sort((a,b) => a.name.localeCompare(b.name, 'it', {sensitivity:'base'}));
if (new Set(characters.map(c => c.id)).size !== characters.length) throw new Error('Personaggi natalizi duplicati');
await writeFile(new URL('roster-natale-catalog.js', demo), `/* Generato da scripts/build-christmas-roster.mjs. */\nwindow.CHRISTMAS_ROSTER = ${JSON.stringify({characters}, null, 2)};\n`);
console.log(`Roster natalizio: ${characters.length} personaggi (${fileURLToPath(demo)}).`);
