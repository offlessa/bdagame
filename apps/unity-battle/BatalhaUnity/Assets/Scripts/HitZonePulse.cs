using UnityEngine;
using System.Collections;

public class HitZonePulse : MonoBehaviour
{
    [Header("Pulse")]
    public float pulseSpeed = 1.2f;
    public float minAlpha   = 0.35f;
    public float maxAlpha   = 0.9f;
    public Color baseColor  = new Color(0.4f, 0.9f, 1f);

    SpriteRenderer _sr;

    void Start()
    {
        _sr = GetComponent<SpriteRenderer>();
        if (_sr != null) _sr.color = baseColor;
        StartCoroutine(Pulse());
    }

    IEnumerator Pulse()
    {
        while (true)
        {
            float t = (Mathf.Sin(Time.time * pulseSpeed * Mathf.PI * 2f) + 1f) * 0.5f;
            if (_sr != null)
            {
                var c = _sr.color;
                c.a       = Mathf.Lerp(minAlpha, maxAlpha, t);
                _sr.color = c;
            }
            yield return null;
        }
    }

    public void Flash()
    {
        StopAllCoroutines();
        StartCoroutine(FlashThenResume());
    }

    IEnumerator FlashThenResume()
    {
        if (_sr != null) _sr.color = Color.white;
        yield return new WaitForSeconds(0.12f);
        if (_sr != null) _sr.color = baseColor;
        StartCoroutine(Pulse());
    }
}
