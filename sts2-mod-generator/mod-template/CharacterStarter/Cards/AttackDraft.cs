using BaseLib.Abstracts;
using BaseLib.Utils;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.CardPools;
using MegaCrit.Sts2.Core.Models.Cards;
using MegaCrit.Sts2.Core.ValueProps;

namespace CharacterStarter.Cards;

[Pool(typeof(IroncladCardPool))]
public class AttackDraft : CustomCardModel
{
    public AttackDraft() : base(AttackSettings.Cost, CardType.Attack, CardRarity.Common, TargetType.AnyEnemy)
    {
    }

    protected override IEnumerable<DynamicVar> CanonicalVars => [new DamageVar(AttackSettings.Damage, ValueProp.Move)];

    public override string PortraitPath => ModelDb.Card<StrikeIronclad>().PortraitPath;

    public override List<(string, string)> Localization => new CardLoc("追加アタック", "敵1体に {Damage:diff()} ダメージを与える。");

    protected override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
    {
        await DamageCmd.Attack(DynamicVars.Damage.BaseValue)
            .FromCard(this, cardPlay)
            .Targeting(cardPlay.Target)
            .Execute(choiceContext);
    }
}
