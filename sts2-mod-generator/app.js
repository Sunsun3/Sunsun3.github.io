const formats = {
  source: {
    tree: ['Assets/Portraits/README.txt', 'Characters/CharacterDraft.cs', 'CharacterStarter.csproj', 'CharacterStarter.json', 'character.json', 'ModEntry.cs', 'README.md'],
    note: 'ソースコード、素材フォルダー、ビルド手順を収録。'
  },
  built: {
    tree: ['CharacterStarter.dll', 'CharacterStarter.json', 'character.json', 'README.txt'],
    note: 'キャラクター本体と、BaseLib・BaseLibCompatibilityHelperのフォルダーを同梱。展開してmodsに配置します。'
  }
};
const download = document.querySelector('#download');
const statusLine = document.querySelector('#status');
function updatePreview() {
  const mode = document.querySelector('input[name=mode]:checked').value;
  const {tree, note} = formats[mode];
  document.querySelector('#tree').textContent = tree.map((name, i) => (i === tree.length - 1 ? '└─ ' : '├─ ') + name).join('\n');
  document.querySelector('#help').textContent = note;
  download.href = './downloads/CharacterStarter-' + mode + '.zip';
  statusLine.textContent = '';
}
document.querySelector('fieldset').addEventListener('change', updatePreview);
download.addEventListener('click', async (event) => {
  event.preventDefault();
  const input = document.querySelector('#character-name');
  const name = input.value.trim();
  if (!name || name.length > 40) {
    input.setCustomValidity('キャラクター名を1〜40文字で入力してください。');
    input.reportValidity();
    return;
  }
  input.setCustomValidity('');
  if (download.getAttribute('aria-busy') === 'true') return;
  download.setAttribute('aria-busy', 'true');
  statusLine.textContent = 'ZIPを生成しています…';
  try {
    const response = await fetch(download.href);
    if (!response.ok) throw new Error('テンプレートの取得に失敗しました。');
    const zip = await JSZip.loadAsync(await response.arrayBuffer());
    zip.file('CharacterStarter/character.json', JSON.stringify({name}, null, 2));
    const manifestPath = 'CharacterStarter/CharacterStarter.json';
    const manifest = JSON.parse(await zip.file(manifestPath).async('string'));
    manifest.name = name;
    zip.file(manifestPath, JSON.stringify(manifest, null, 2));
    const blob = await zip.generateAsync({type: 'blob', compression: 'DEFLATE'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'CharacterStarter.zip';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    statusLine.textContent = '生成しました。ZIP内のREADMEの手順で配置してください。';
  } catch (error) {
    statusLine.textContent = '生成できませんでした。' + error.message;
  } finally {
    download.removeAttribute('aria-busy');
  }
});
document.querySelector('#character-name').addEventListener('input', (event) => {
  event.target.setCustomValidity('');
});
updatePreview();

// Engraved tower and orbital rings, drawn in the header's native palette.
const ctx = document.querySelector('#art').getContext('2d');
if (ctx) {
  ctx.translate(324,194);
  function line(points, color, fill) {
    ctx.beginPath();
    points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    if(fill){ctx.closePath();ctx.fillStyle=fill;ctx.fill();}
    ctx.strokeStyle=color;ctx.stroke();
  }
  for(const radius of [119,126,150]) {
    ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.strokeStyle='#595746';ctx.stroke();
  }
  for(let i=0;i<60;i++) {
    const angle=i*Math.PI/30,end=i%5===0?161:153;
    line([[150*Math.cos(angle),150*Math.sin(angle)],[end*Math.cos(angle),end*Math.sin(angle)]],'#80765c');
  }
  for(let i=0;i<90;i++){
    const x=Math.sin(i*73)*300,y=Math.cos(i*43)*178;
    ctx.fillStyle=i%4?'#776e58':'#dcc08e';ctx.fillRect(x,y,2,2);
  }
  const tiers=[[0,-152,14,-88],[0,-106,28,-49],[-4,-72,39,-12],[2,-44,49,30],[-3,-7,65,74],[1,35,85,107]];
  for(const [x,peak,w,y] of tiers){
    line([[x,peak],[x+w*.52,y-19],[x+w,y],[x+8,y+13],[x-w,y+5],[x-w*.4,y-21]],'#d4b587','#3b3c35');
    line([[x,peak],[x+8,y+13],[x-w,y+5]],'#a18c66','#555246');
    for(let n=1;n<8;n++){line([[x+n*.4,peak+10],[x+w*n/9,y+10-n]],'#79705b');}
  }
  line([[-85,114],[-39,121],[-17,143],[6,134],[20,155],[31,128],[85,113]],'#b49a71','#353831');
}
