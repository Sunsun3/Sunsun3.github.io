using BaseLib.Abstracts;
using CharacterStarter.Cards;
using Godot;
using MegaCrit.Sts2.Core.Entities.Characters;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Characters;
using System.Text.Json;

namespace CharacterStarter.Characters;

public class CharacterDraft : PlaceholderCharacterModel
{
    public static string DisplayName
    {
        get
        {
            var path = Path.Combine(Path.GetDirectoryName(typeof(CharacterDraft).Assembly.Location)!, "character.json");
            if (!File.Exists(path)) return "塔の旅人";
            using var document = JsonDocument.Parse(File.ReadAllText(path));
            return document.RootElement.GetProperty("name").GetString() ?? "塔の旅人";
        }
    }

    public override Color NameColor => new("e8c38e");
    public override CharacterGender Gender => CharacterGender.Neutral;
    public override int StartingHp => 70;
    public override IEnumerable<CardModel> StartingDeck => ModelDb.Character<Ironclad>().StartingDeck.Concat([ModelDb.Card<AttackDraft>()]);
    public override IReadOnlyList<RelicModel> StartingRelics => ModelDb.Character<Ironclad>().StartingRelics;
    public override CardPoolModel CardPool => ModelDb.Character<Ironclad>().CardPool;
    public override RelicPoolModel RelicPool => ModelDb.Character<Ironclad>().RelicPool;
    public override PotionPoolModel PotionPool => ModelDb.Character<Ironclad>().PotionPool;
    public override List<(string, string)> Localization => new CharacterLoc(
        DisplayName, DisplayName, "塔に挑む、新たな旅人。",
        "その人", "その人", "その人の", "その人の", "勇気",
        "準備できた。", "先へ進もう。", "まだ終わらない。", "金貨を手に入れた。",
        "旅人のカード", "アイアンクラッドのカードを使用します。");
}
