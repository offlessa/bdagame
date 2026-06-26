using UnityEngine;
using System.Runtime.InteropServices;

// Camada de abstração para enviar mensagens ao React Native
public static class NativeAPI
{
#if UNITY_IOS && !UNITY_EDITOR
    [DllImport("__Internal")]
    static extern void sendMessageToRN(string message);
#endif

    public static void SendMessageToRN(string message)
    {
#if UNITY_ANDROID && !UNITY_EDITOR
        using var unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer");
        using var activity    = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity");
        activity.Call("sendMessageToRN", message);
#elif UNITY_IOS && !UNITY_EDITOR
        sendMessageToRN(message);
#else
        Debug.Log("[NativeAPI] " + message);
#endif
    }
}
