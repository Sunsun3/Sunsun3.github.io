const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const JSZip = require('../sts2-mod-generator/jszip.min.js');
const {projectIdFor, personalizeArchive} = require('../sts2-mod-generator/generator.js');

async function generate(mode, name, attack = {cost: 1, damage: 6}) {
  const archive = path.join(__dirname, '../sts2-mod-generator/downloads', `CharacterStarter-${mode}.zip`);
  const original = await JSZip.loadAsync(await fs.readFile(archive));
  const result = await personalizeArchive(original, name, mode, attack);
  const generated = await JSZip.loadAsync(await original.generateAsync({type: 'nodebuffer'}));
  return {original, generated, result};
}

test('source archive has a buildable project identity and personalized code', async () => {
  const name = '塔の旅人';
  const {generated, result} = await generate('source', name);
  const id = projectIdFor(name);
  assert.equal(result.projectId, id);
  assert.ok(generated.file(`${id}/${id}.csproj`));
  assert.ok(generated.file(`${id}/Cards/AttackDraft.cs`));
  assert.equal(generated.file('CharacterStarter/CharacterStarter.csproj'), null);
  assert.equal(generated.file('.gitignore'), null);
  assert.equal(Object.keys(generated.files).some(file => /\/(?:obj|bin)\//.test(file)), false);
  const manifest = JSON.parse(await generated.file(`${id}/${id}.json`).async('string'));
  assert.equal(manifest.id, id);
  assert.equal(manifest.name, name);
  const code = await generated.file(`${id}/Characters/CharacterDraft.cs`).async('string');
  assert.match(code, new RegExp(`namespace ${id}\\.Characters;`));
  assert.match(code, /return "塔の旅人"/);
  assert.match(code, /ModelDb\.Card<AttackDraft>\(\)/);
  const card = await generated.file(`${id}/Cards/AttackDraft.cs`).async('string');
  assert.match(card, new RegExp(`namespace ${id}\\.Cards;`));
  assert.match(card, /AttackSettings\.Cost/);
  assert.deepEqual(JSON.parse(await generated.file(`${id}/attack-card.json`).async('string')), {cost: 1, damage: 6});
  const entry = await generated.file(`${id}/ModEntry.cs`).async('string');
  assert.match(entry, new RegExp(`namespace ${id};`));
  assert.ok(generated.file('BaseLib/BaseLib.dll'));
  assert.match(await generated.file(`${id}/GENERATION.md`).async('string'), /キャラクター名: 塔の旅人/);
});

test('quotes and backslashes in a name stay valid in C# source', async () => {
  const {generated, result} = await generate('source', 'A"\\B');
  const code = await generated.file(`${result.projectId}/Characters/CharacterDraft.cs`).async('string');
  assert.match(code, /return "A\\"\\\\B"/);
});

test('built archive retains its DLL and uses the requested name and attack values', async () => {
  const {original, generated, result} = await generate('built', 'New Hero', {cost: 3, damage: 42});
  assert.equal(result.projectId, 'CharacterStarter');
  assert.deepEqual(
    await generated.file('CharacterStarter/CharacterStarter.dll').async('uint8array'),
    await original.file('CharacterStarter/CharacterStarter.dll').async('uint8array')
  );
  assert.deepEqual(JSON.parse(await generated.file('CharacterStarter/character.json').async('string')), {name: 'New Hero'});
  assert.deepEqual(JSON.parse(await generated.file('CharacterStarter/attack-card.json').async('string')), {cost: 3, damage: 42});
  const manifest = JSON.parse(await generated.file('CharacterStarter/CharacterStarter.json').async('string'));
  assert.equal(manifest.id, 'CharacterStarter');
  assert.equal(manifest.name, 'New Hero');
  assert.match(await generated.file('CharacterStarter/GENERATION.md').async('string'), /共通のビルド済みファイル/);
  assert.match(await generated.file('CharacterStarter/GENERATION.md').async('string'), /ダメージ: 42/);
});

test('source archive accepts boundary attack values', async () => {
  const {generated, result} = await generate('source', 'Boundary', {cost: 0, damage: 999});
  assert.deepEqual(JSON.parse(await generated.file(`${result.projectId}/attack-card.json`).async('string')), {cost: 0, damage: 999});
});

test('invalid names are rejected', async () => {
  const zip = await JSZip.loadAsync(await fs.readFile(path.join(__dirname, '../sts2-mod-generator/downloads/CharacterStarter-source.zip')));
  await assert.rejects(personalizeArchive(zip, '  ', 'source'));
  await assert.rejects(personalizeArchive(zip, 'A\nB', 'source'));
  await assert.rejects(personalizeArchive(zip, 'A\u2028B', 'source'));
  await assert.rejects(personalizeArchive(zip, 'Hero', 'source', {cost: '', damage: 6}));
  await assert.rejects(personalizeArchive(zip, 'Hero', 'source', {cost: 10, damage: 6}));
  await assert.rejects(personalizeArchive(zip, 'Hero', 'source', {cost: 1, damage: 0}));
  await assert.rejects(personalizeArchive(zip, 'Hero', 'source', {cost: 1, damage: 2.5}));
});
