using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class BattleUI : MonoBehaviour
{
    [Header("Barras")]
    public Slider hypeBar;
    public Slider crowdBar;
    public Slider criatividadeBar;

    [Header("Textos")]
    public TextMeshProUGUI comboText;
    public TextMeshProUGUI flowText;
    public TextMeshProUGUI punchlineText;
    public TextMeshProUGUI presencaText;

    [Header("Refs")]
    public BattleManager battleManager;

    void Update()
    {
        if (battleManager == null) return;

        hypeBar.value         = battleManager.hype          / 100f;
        crowdBar.value        = battleManager.crowd         / 100f;
        criatividadeBar.value = battleManager.criatividade  / 100f;

        comboText.text     = battleManager.combo > 1 ? $"x{battleManager.combo} COMBO" : "";
        flowText.text      = $"Flow\n{battleManager.scoreFlow:F1}";
        punchlineText.text = $"Punch\n{battleManager.scorePunchline:F0}";
        presencaText.text  = $"Presença\n{battleManager.scorePresenca:F1}";
    }
}
