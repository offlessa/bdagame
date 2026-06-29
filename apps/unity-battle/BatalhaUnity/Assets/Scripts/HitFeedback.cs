using UnityEngine;
using TMPro;
using System.Collections;

public class HitFeedback : MonoBehaviour
{
    public TextMeshProUGUI feedbackText;

    static readonly string[] Labels = { "MISS",                    "OK!",                      "GOOD!",                   "PERFECT!" };
    static readonly Color[]  Colors = {
        new Color(0.55f, 0.55f, 0.55f),  // Miss  - cinza
        new Color(0.75f, 0.85f, 1f),      // Ok    - azul claro
        new Color(0.3f,  1f,    0.35f),   // Good  - verde
        new Color(1f,    0.88f, 0.1f),    // Perfect - ouro
    };
    static readonly float[] Sizes = { 52f, 62f, 72f, 92f };

    Coroutine _current;

    public void Show(NoteQuality quality)
    {
        if (_current != null) StopCoroutine(_current);
        _current = StartCoroutine(Animate(quality));
    }

    IEnumerator Animate(NoteQuality quality)
    {
        int idx = (int)quality;
        feedbackText.text     = Labels[idx];
        feedbackText.color    = Colors[idx];
        feedbackText.fontSize = Sizes[idx];
        feedbackText.gameObject.SetActive(true);
        feedbackText.transform.localScale = Vector3.one * 1.35f;

        float t = 0f;
        const float duration = 0.6f;

        while (t < duration)
        {
            t += Time.deltaTime;
            float p = t / duration;

            float scale = Mathf.Lerp(1.35f, 1f, Mathf.Clamp01(p * 4f));
            feedbackText.transform.localScale = Vector3.one * scale;

            float alpha = p < 0.55f ? 1f : Mathf.Lerp(1f, 0f, (p - 0.55f) / 0.45f);
            var c = feedbackText.color; c.a = alpha; feedbackText.color = c;

            yield return null;
        }

        feedbackText.gameObject.SetActive(false);
    }
}
