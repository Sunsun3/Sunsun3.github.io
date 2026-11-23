# STS2 キャラクターModジェネレーター

https://sunsun3.github.io/sts2-mod-generator/

GitHub Pages の main ブランチ、ルートディレクトリで配信する静的アプリです。テンプレートZIPを fetch するため、GitHub Pages などの HTTP サーバー経由で開いてください。C# 版は入力名からプロジェクト ID、ファイル名、名前空間を生成します。ビルド済み版は共通 DLL と入力名の設定ファイルを同梱します。両方の ZIP に生成内容を記した GENERATION.md と開発・導入手順が入っています。

アタックカードのコスト（0〜9）とダメージ（1〜999）を設定できます。生成 ZIP の `attack-card.json` に値を保存し、同梱のカードを初期デッキに1枚追加します。配布 ZIP の元になる C# ソースは `sts2-mod-generator/mod-template/` にあります。ローカルにゲーム v0.113.1 と .NET 9 SDK がある環境では `python scripts/build_mod_templates.py` で両 ZIP を再生成できます。生成処理のテストは `node --test tests/generator.test.cjs` で実行します。
