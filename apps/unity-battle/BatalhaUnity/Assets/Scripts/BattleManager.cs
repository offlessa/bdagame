using UnityEngine;
using UnityEngine.InputSystem;

public class BattleManager : MonoBehaviour
{
    [Header("Barras")]
    public float hype         = 0f;
    public float criatividade = 0f;
    public float crowd        = 50f;

    [Header("Pontuação")]
    public float scoreFlow      = 0f;
    public float scorePunchline = 0f;
    public float scorePresenca  = 0f;

    [Header("Combo")]
    public int combo   = 0;
    public int perfect = 0;

    [Header("Sistemas")]
    public NoteSystem      noteSystem;
    public PunchlineSystem punchlineSystem;

    [Header("Personagens")]
    public CharacterVisual playerVisual;
    public CharacterVisual opponentVisual;

    StartBattlePayload _config;

    void OnEnable()  => ReactBridge.OnStartBattle += StartBattle;
    void OnDisable() => ReactBridge.OnStartBattle -= StartBattle;

#if UNITY_EDITOR
    void Update()
    {
        if (Keyboard.current != null && Keyboard.current.f1Key.wasPressedThisFrame)
            StartBattle(new StartBattlePayload
            {
                playerName   = "Jogador",
                opponentName = "Oponente",
                playerLook   = new CharacterLookData(),
                opponentLook = new CharacterLookData { cabelo = "2", roupa_top = "2" },
            });
    }
#endif

    void StartBattle(StartBattlePayload config)
    {
        _config = config;
        Debug.Log($"Batalha iniciada: {config.playerName} vs {config.opponentName}");

        if (config.playerLook   != null) playerVisual?.Apply(config.playerLook);
        if (config.opponentLook != null) opponentVisual?.Apply(config.opponentLook);

        noteSystem?.StartNotes();
        punchlineSystem?.StartPunchlines();

        ReactBridge.SendToReact("BATTLE_START", null);
    }

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

    public void OnNoteMiss()
    {
        combo = 0;
        hype  = Mathf.Clamp(hype - 15f, 0, 100);
        crowd = Mathf.Clamp(crowd - 5f,  0, 100);
    }

    public void OnPunchlineSuccess()
    {
        scorePunchline += 1f;
        crowd = Mathf.Clamp(crowd + 20f, 0, 100);
    }

    public void EndBattle()
    {
        noteSystem?.StopNotes();
        punchlineSystem?.StopPunchlines();

        string winner = crowd > 55f ? "player"
                      : crowd < 45f ? "opponent"
                      :               "draw";

        Debug.Log($"Batalha encerrada! Vencedor: {winner} (crowd={crowd:F0})");

        ReactBridge.SendBattleResult(new BattleResult {
            winner = winner,
            scores = new BattleResultScores {
                flow      = Mathf.Round(scoreFlow      * 10f) / 10f,
                punchline = Mathf.Round(scorePunchline * 10f) / 10f,
                presenca  = Mathf.Round(scorePresenca  * 10f) / 10f,
            },
            crowd   = Mathf.RoundToInt(crowd),
            combo   = combo,
            perfect = perfect,
        });
    }
}

public enum NoteQuality { Miss, Ok, Good, Perfect }
public struct NoteResult { public NoteQuality quality; public bool isDifficult; }
