(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Sts2Generator = api;
})(globalThis, function () {
  const templateId = 'CharacterStarter';

  function validateName(value) {
    const name = value.trim();
    if (!name || name.length > 40 || /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(name)) {
      throw new Error('キャラクター名を1〜40文字で入力してください。');
    }
    return name;
  }

  function nameHash(name) {
    let hash = 2166136261;
    for (let i = 0; i < name.length; i++) {
      hash ^= name.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function projectIdFor(name) {
    const slug = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24)
      .replace(/_+$/g, '') || 'Custom';
    return `Character_${slug}_${nameHash(name)}`;
  }

  function validateAttack(raw) {
    const parse = (value, label, min, max) => {
      if (value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '')) {
        throw new Error(`${label}を${min}〜${max}の整数で入力してください。`);
      }
      const number = Number(value);
      if (!Number.isInteger(number) || number < min || number > max) {
        throw new Error(`${label}を${min}〜${max}の整数で入力してください。`);
      }
      return number;
    };
    return {
      cost: parse(raw?.cost, 'コスト', 0, 9),
      damage: parse(raw?.damage, 'ダメージ', 1, 999)
    };
  }

  async function personalizeArchive(zip, rawName, mode, rawAttack = {cost: 1, damage: 6}) {
    const name = validateName(rawName);
    const attack = validateAttack(rawAttack);
    if (mode !== 'source' && mode !== 'built') throw new Error('テンプレート形式が不正です。');
    const projectId = mode === 'source' ? projectIdFor(name) : templateId;
    const originalRoot = `${templateId}/`;
    const targetRoot = `${projectId}/`;
    const sourceFiles = Object.keys(zip.files).filter(path => path.startsWith(originalRoot) && !zip.files[path].dir);
    const required = [`${originalRoot}character.json`, `${originalRoot}${templateId}.json`, `${originalRoot}attack-card.json`];
    if (required.some(path => !zip.file(path)) ||
      (mode === 'source' && !zip.file(`${originalRoot}Cards/AttackDraft.cs`))) {
      throw new Error('テンプレートに必要なファイルがありません。');
    }

    if (mode === 'source') {
      const contents = await Promise.all(sourceFiles.map(async path => {
        const file = zip.file(path);
        const textFile = /\.(cs|csproj|json|md|txt)$/i.test(path);
        const data = await file.async(textFile ? 'string' : 'uint8array');
        const newPath = targetRoot + path.slice(originalRoot.length).split(templateId).join(projectId);
        const escapedName = /\.cs$/i.test(path) ? name.replace(/\\/g, '\\\\').replace(/"/g, '\\"') : name;
        const content = textFile ? data.split(templateId).join(projectId).split('塔の旅人').join(escapedName) : data;
        return {path: newPath, content};
      }));
      zip.remove(originalRoot);
      for (const file of contents) zip.file(file.path, file.content);
    }

    zip.file(`${targetRoot}character.json`, JSON.stringify({name}, null, 2) + '\n');
    zip.file(`${targetRoot}attack-card.json`, JSON.stringify(attack, null, 2) + '\n');
    const manifestPath = `${targetRoot}${projectId}.json`;
    const manifestFile = zip.file(manifestPath);
    if (!manifestFile) throw new Error('Mod設定ファイルがありません。');
    const manifest = JSON.parse(await manifestFile.async('string'));
    manifest.id = projectId;
    manifest.name = name;
    zip.file(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

    const record = [
      '# 生成内容', '',
      `- キャラクター名: ${name}`,
      `- 形式: ${mode === 'source' ? 'C# プロジェクト' : 'ビルド済み'}`,
      `- Mod ID: ${projectId}`,
      `- フォルダー: ${projectId}/`,
      '- アタックカード: 追加アタック',
      `- コスト: ${attack.cost}`,
      `- ダメージ: ${attack.damage}`,
      '',
      mode === 'source'
        ? 'このプロジェクトは入力名から生成されています。README.md の手順でビルドしてください。'
        : '同梱 DLL は共通のビルド済みファイルです。名前は character.json、カード値は attack-card.json から読み込まれます。',
      ''
    ].join('\n');
    zip.file(`${targetRoot}GENERATION.md`, record);
    return {
      projectId,
      fileName: mode === 'source'
        ? `${projectId}-c${attack.cost}-d${attack.damage}-source.zip`
        : `${projectId}-built-${nameHash(name)}-c${attack.cost}-d${attack.damage}.zip`,
      record
    };
  }

  return {validateName, validateAttack, projectIdFor, personalizeArchive};
});
