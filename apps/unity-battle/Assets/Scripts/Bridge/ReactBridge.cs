using UnityEngine;
using System;

// Coloca esse script num GameObject chamado "ReactBridge" na cena inicial.
// É o canal de comunicação com o React Native.
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

    void Start()
    {
        // Avisa o React Native que Unity está pronto
        SendToReact("READY", null);
    }

    // Chamado pelo React Native via UnitySendMessage
    public void OnReactMessage(string json)
    {
        var msg = JsonUtility.FromJson<RNMessage>(json);
        switch (msg.type)
        {
            case "START_BATTLE":
                var payload = JsonUtility.FromJson<StartBattlePayload>(msg.payload);
                OnStartBattle?.Invoke(payload);
                break;
            case "PAUSE":
                Time.timeScale = 0f;
                break;
            case "RESUME":
                Time.timeScale = 1f;
                break;
            case "QUIT":
                Application.Quit();
                break;
        }
    }

    // Envia resultado pro React Native
    public static void SendBattleResult(BattleResult result)
    {
        SendToReact("BATTLE_RESULT", JsonUtility.ToJson(result));
    }

    public static void SendPlayerQuit()
    {
        SendToReact("PLAYER_QUIT", null);
    }

    static void SendToReact(string type, string payload)
    {
#if UNITY_ANDROID || UNITY_IOS
        // UnitySendMessage chega no onUnityMessage do React Native
        // O terceiro argumento é o dado recebido em event.nativeEvent.message
        var json = payload != null
            ? $"{{\"type\":\"{type}\",\"payload\":{payload}}}"
            : $"{{\"type\":\"{type}\"}}";
        // Usa o canal nativo do @azesmway/react-native-unity
        NativeAPI.SendMessageToRN(json);
#else
        Debug.Log($"[Bridge→RN] type={type} payload={payload}");
#endif
    }
}

[Serializable] public class RNMessage       { public string type; public string payload; }
[Serializable] public class StartBattlePayload
{
    public string playerName;
    public string opponentName;
    public string track;
    public string difficulty;
    // look do personagem (expandir conforme necessário)
    public string cabelo;
    public string roupa_top;
    public string calcado;
}
[Serializable] public class BattleResultScores { public float flow; public float punchline; public float presenca; }
[Serializable] public class BattleResult
{
    public string winner;   // "player" | "opponent"
    public BattleResultScores scores;
    public int crowd;
    public int combo;
    public int perfect;
}
