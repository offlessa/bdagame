using UnityEngine;

// Coloca num GameObject "BattleManager" na cena de batalha.
// Gerencia o estado geral da batalha.
public class BattleManager : MonoBehaviour
{
    [Header("Barras")]
    public float hype        = 0f;   // 0-100
    public float criatividade = 0f;  // 0-100
    public float crowd       = 50f;  // 0-100 (barra de vida da plateia)

    [Header("Pontuação")]
    public float scoreFlow      = 0f;
    public float scorePunchline = 0f;
    public float scorePresenca  = 0f;

    [Header("Combo")]
    public int combo   = 0;
    public int perfect = 0;

    StartBattlePayload _config;

    void OnEnable()  => ReactBridge.OnStartBattle += StartBattle;
    void OnDisable() => ReactBridge.OnStartBattle -= StartBattle;

    void StartBattle(StartBattlePayload config)
    {
        _config = config;
        Debug.Log($"Batalha iniciada: {config.playerName} vs {config.opponentName}");
        ReactBridge.Instance.SendToReact("BATTLE_START", null); // avisa RN
        // TODO: carregar cena da batalha, iniciar pista de notas
    }

    // Chamado pelo NoteSystem quando acerta nota
    public void OnNoteHit(NoteResult result)
    {
        int points = result.quality switch {
            NoteQuality.Perfect => 100,
            NoteQuality.Good    => 60,
            NoteQuality.Ok      => 30,
            _                   => 0,
        };

        if (result.quality == NoteQuality.Perfect) perfect++;
        if (result.quality >= NoteQuality.Good)    combo++;
        else                                        combo = 0;

        float multiplier = 1f + (combo / 20f);
        scoreFlow    += points * multiplier * 0.01f;
        hype         = Mathf.Clamp(hype + points * 0.1f, 0, 100);
        criatividade = Mathf.Clamp(criatividade + (result.isDifficult ? 8f : 2f), 0, 100);
        crowd        = Mathf.Clamp(crowd + points * 0.05f, 0, 100);
    }

    // Chamado pelo NoteSystem quando erra nota
    public void OnNoteMiss()
    {
        combo = 0;
        hype  = Mathf.Clamp(hype - 15f, 0, 100);
        crowd = Mathf.Clamp(crowd - 5f, 0, 100);
    }

    // Chamado pelo PunchlineSystem
    public void OnPunchlineSuccess()
    {
        scorePunchline += 1f;
        crowd = Mathf.Clamp(crowd + 20f, 0, 100);
        // TODO: trigger câmera shake + efeito visual
    }

    public void EndBattle(string winner)
    {
        ReactBridge.SendBattleResult(new BattleResult {
            winner = winner,
            scores = new BattleResultScores {
                flow      = Mathf.Round(scoreFlow * 10f) / 10f,
                punchline = Mathf.Round(scorePunchline * 10f) / 10f,
                presenca  = Mathf.Round(scorePresenca * 10f) / 10f,
            },
            crowd   = Mathf.RoundToInt(crowd),
            combo   = combo,
            perfect = perfect,
        });
    }
}

public enum NoteQuality { Miss, Ok, Good, Perfect }
public struct NoteResult { public NoteQuality quality; public bool isDifficult; }
