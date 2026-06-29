using UnityEngine;
using System;

public class ReactBridge : MonoBehaviour
{
    public static ReactBridge Instance { get; private set; }
    public static event Action<StartBattlePayload> OnStartBattle;

    void Awake()
    {
        if (Instance != null) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    void Start() => SendToReact("READY", null);

    public void OnReactMessage(string json)
    {
        var msg = JsonUtility.FromJson<RNMessage>(json);
        switch (msg.type)
        {
            case "START_BATTLE":
                var payload = JsonUtility.FromJson<StartBattlePayload>(msg.payload);
                OnStartBattle?.Invoke(payload);
                break;
            case "PAUSE":  Time.timeScale = 0f; break;
            case "RESUME": Time.timeScale = 1f; break;
            case "QUIT":   Application.Quit();  break;
        }
    }

    public static void SendBattleResult(BattleResult result)
        => SendToReact("BATTLE_RESULT", JsonUtility.ToJson(result));

    public static void SendPlayerQuit() => SendToReact("PLAYER_QUIT", null);

    public static void SendToReact(string type, string payload)
    {
#if UNITY_ANDROID || UNITY_IOS
        var json = payload != null
            ? $"{{\"type\":\"{type}\",\"payload\":{payload}}}"
            : $"{{\"type\":\"{type}\"}}";
        NativeAPI.SendMessageToRN(json);
#else
        Debug.Log($"[Bridge→RN] type={type} payload={payload}");
#endif
    }
}

[Serializable] public class RNMessage { public string type; public string payload; }

[Serializable] public class StartBattlePayload
{
    public string            playerName;
    public string            opponentName;
    public string            track;
    public string            difficulty;
    public CharacterLookData playerLook;
    public CharacterLookData opponentLook;
}

[Serializable] public class BattleResultScores { public float flow; public float punchline; public float presenca; }

[Serializable] public class BattleResult
{
    public string             winner;
    public BattleResultScores scores;
    public int                crowd;
    public int                combo;
    public int                perfect;
}
