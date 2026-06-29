using UnityEngine;
using UnityEngine.InputSystem;
using System.Collections;
using TMPro;

public class PunchlineSystem : MonoBehaviour
{
    [Header("Config")]
    public float intervalMin    = 10f;
    public float intervalMax    = 18f;
    public float windowDuration = 2f;

    [Header("Refs")]
    public BattleManager          battleManager;
    public TextMeshProUGUI        promptText;
    public UnityEngine.UI.Slider  timerBar;

    bool _running;

    public void StartPunchlines()
    {
        if (_running) return;
        _running = true;
        StartCoroutine(PunchlineLoop());
    }

    public void StopPunchlines()
    {
        _running = false;
        StopAllCoroutines();
        SetVisible(false);
    }

    IEnumerator PunchlineLoop()
    {
        while (_running)
        {
            yield return new WaitForSeconds(Random.Range(intervalMin, intervalMax));
            if (_running) yield return StartCoroutine(TriggerWindow());
        }
    }

    IEnumerator TriggerWindow()
    {
        SetVisible(true);
        float elapsed = 0f;
        bool hit = false;

        while (elapsed < windowDuration)
        {
            elapsed += Time.deltaTime;
            if (timerBar != null)
                timerBar.value = 1f - (elapsed / windowDuration);

            bool pressed = (Keyboard.current   != null && Keyboard.current.enterKey.wasPressedThisFrame) ||
                           (Touchscreen.current != null && Touchscreen.current.primaryTouch.phase.ReadValue() == UnityEngine.InputSystem.TouchPhase.Began);

            if (pressed) { hit = true; break; }
            yield return null;
        }

        if (hit) battleManager?.OnPunchlineSuccess();
        SetVisible(false);
    }

    void SetVisible(bool show)
    {
        if (promptText != null) promptText.gameObject.SetActive(show);
        if (timerBar   != null) timerBar.gameObject.SetActive(show);
    }
}
