using MegaCrit.Sts2.Core.Modding;

namespace CharacterStarter;

[ModInitializer(nameof(Initialize))]
public static class ModEntry
{
    public static void Initialize()
    {
        Console.WriteLine($"[CharacterStarter] Loaded: {Characters.CharacterDraft.DisplayName}");
        // BaseLibがCharacterDraftを検出し、キャラクター一覧へ登録します。
    }
}
