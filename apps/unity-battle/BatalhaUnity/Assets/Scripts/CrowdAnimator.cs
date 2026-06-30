using UnityEngine;

// Plateia animada: troca de frame conforme o crowd do BattleManager
// + balanço suave contínuo + hype burst no punchline
public class CrowdAnimator : MonoBehaviour
{
    [Header("Sprites (arrastar do projeto)")]
    public Sprite[] frames; // plateia1..4: quieta → loucura total

    [Header("Animação de balanço")]
    public float bobAmplitude = 0.08f;
    public float bobSpeed     = 1.4f;

    [Header("Hype burst")]
    public float burstDuration = 0.6f;

    SpriteRenderer _sr;
    BattleManager  _bm;
    float          _burstTimer;
    float          _baseY;

    void Awake()
    {
        _sr    = GetComponent<SpriteRenderer>();
        _baseY = transform.position.y;
    }

    void Start()
    {
        _bm = FindObjectOfType<BattleManager>();
        if (frames != null && frames.Length > 0)
            _sr.sprite = frames[0];
    }

    void Update()
    {
        // Balanço vertical suave
        float bob = Mathf.Sin(Time.time * bobSpeed) * bobAmplitude;
        var p = transform.position;
        p.y = _baseY + bob;
        transform.position = p;

        if (_bm == null) return;

        // Escolher frame pelo nível de plateia (0-100)
        float crowd = _bm.crowd;
        int targetFrame = crowd < 30f ? 0
                        : crowd < 55f ? 1
                        : crowd < 75f ? 2
                        : 3;

        // Hype burst: força frame 3 por um tempo
        if (_burstTimer > 0f)
        {
            _burstTimer -= Time.deltaTime;
            targetFrame = 3;
        }

        if (frames != null && targetFrame < frames.Length)
            _sr.sprite = frames[targetFrame];
    }

    // Chamar do BattleManager quando rolar punchline
    public void TriggerHypeBurst() => _burstTimer = burstDuration;
}
