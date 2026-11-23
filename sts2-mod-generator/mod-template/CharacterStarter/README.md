# CharacterStarter
入力名のキャラクターを選択画面に追加します。見た目、通常のカード報酬、初期レリックはアイアンクラッドを使用します。HPは70です。同時に使用できる生成キャラクターは1体です。

## 追加アタックカード
初期デッキに「追加アタック」を1枚追加します。敵1体にダメージを与えるカードで、絵はアイアンクラッドのストライクを使用します。`attack-card.json` の `cost`（0〜9）と `damage`（1〜999）を変更すると、次のゲーム起動時に設定が反映されます。カードはアイアンクラッドのカードプールにも登録されます。

## ビルド済み版
ZIPを展開し、CharacterStarter、BaseLib、BaseLibCompatibilityHelper の3フォルダーを Slay the Spire 2/mods/ に配置します。すでにBaseLibがある場合は重複配置せず既存のバージョンと確認してください。
ゲームを再起動してModを有効化し、キャラクター選択画面を開きます。
character.json の name、attack-card.json の cost と damage を編集して再起動すると設定を変更できます。

## C#版
.NET 9 SDKを用意し、CharacterStarter内で dotnet build -c Release を実行します。
ゲームのインストール先が異なる場合は -p:GameDataDir="sts2.dllのあるフォルダー" を指定します。
bin/Release/net9.0/CharacterStarter.dll と CharacterStarter.json、character.json、attack-card.json を mods/CharacterStarter/ に配置し、同梱の2つの依存Modフォルダーもmodsに配置します。
ゲーム本体のDLLは配布物に含まれません。

BaseLib 3.4.8 / MIT / https://github.com/Alchyr/BaseLib-StS2
ゲーム v0.113.1 を参照してビルド。ゲーム内動作確認は未実施です。
