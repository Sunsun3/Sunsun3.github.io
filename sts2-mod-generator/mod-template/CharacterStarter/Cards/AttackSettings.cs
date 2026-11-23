using System.Text.Json;

namespace CharacterStarter.Cards;

internal static class AttackSettings
{
    private static readonly (int Cost, int Damage) Values = Load();

    public static int Cost => Values.Cost;
    public static int Damage => Values.Damage;

    private static (int Cost, int Damage) Load()
    {
        var path = Path.Combine(Path.GetDirectoryName(typeof(AttackSettings).Assembly.Location)!, "attack-card.json");
        try
        {
            using var document = JsonDocument.Parse(File.ReadAllText(path));
            var cost = document.RootElement.GetProperty("cost").GetInt32();
            var damage = document.RootElement.GetProperty("damage").GetInt32();
            if (cost is >= 0 and <= 9 && damage is >= 1 and <= 999)
                return (cost, damage);
        }
        catch (Exception)
        {
            // An absent or invalid configuration keeps the sample card usable.
        }
        return (1, 6);
    }
}
