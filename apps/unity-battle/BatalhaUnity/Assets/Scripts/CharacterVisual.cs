using UnityEngine;
using System.Collections.Generic;

[System.Serializable]
public class CharacterLookData
{
    public string pele            = "1";
    public string cabelo          = "1";
    public string sobrancelha     = "1";
    public string olhos           = "1";
    public string nariz           = "1";
    public string boca            = "1";
    public string camiseta        = "0";
    public string roupa_top       = "1";
    public string roupa_calca     = "1";
    public string calcado         = "1";
    public string mic             = "1";
    public string relogio         = "0";
    public string cor_cabelo      = "";
    public string cor_sobrancelha = "";
}

public class CharacterVisual : MonoBehaviour
{
    [Header("Look")]
    public CharacterLookData look = new();

    // Canvas original = 2646x1701. Personagem visível ≈ linhas 80–1580 (1500px).
    // displayHeight é a altura do personagem VISÍVEL em unidades Unity.
    [Header("Altura visível do personagem (unidades Unity)")]
    public float displayHeight = 3.5f;

    [Header("Espelhar (oponente)")]
    public bool flipX = false;

    void Start() => Apply(look);

    public void Apply(CharacterLookData l)
    {
        // Destrói todos os filhos existentes
        for (int i = transform.childCount - 1; i >= 0; i--)
            Destroy(transform.GetChild(i).gameObject);

        transform.localScale = Vector3.one;

        var entries = new List<(string path, bool isHair, bool isBrow)>
        {
            ("Personagem/peles/corpo",          false, false),
            ("Personagem/peles/pes",            false, false),
            ("Personagem/peles/braco_esq",      false, false),
            ("Personagem/acessorios/braco_mic", false, false),
        };

        if (l.relogio   != "0") entries.Add(($"Personagem/acessorios/relogio{l.relogio}", false, false));
        if (l.mic       == "2") entries.Add(("Personagem/acessorios/mic_gold",             false, false));
        if (l.camiseta  != "0") entries.Add(($"Personagem/roupas/camiseta{l.camiseta}",    false, false));
        if (l.roupa_calca != "0") entries.Add(($"Personagem/roupas/calca{l.roupa_calca}", false, false));
        if (l.roupa_top != "0") entries.Add(($"Personagem/roupas/top{l.roupa_top}",        false, false));
        if (l.calcado   != "0") entries.Add(($"Personagem/acessorios/tenis{l.calcado}",    false, false));

        entries.Add(("Personagem/cabeca/1",                       false, false));
        if (l.cabelo != "0") entries.Add(($"Personagem/cabelos/{l.cabelo}", true,  false));
        entries.Add(($"Personagem/Olhos/{l.olhos}",               false, false));
        entries.Add(($"Personagem/sobrancelhas/{l.sobrancelha}",  false, true));
        entries.Add(($"Personagem/Narizes/{l.nariz}",             false, false));
        entries.Add(($"Personagem/Bocas/{l.boca}",                false, false));

        int   order   = GetComponent<SpriteRenderer>()?.sortingOrder ?? 0;
        float nativeH = -1f;

        foreach (var (path, isHair, isBrow) in entries)
        {
            // Usa LoadAll pois os sprites estão em Multiple mode
            var sprites = Resources.LoadAll<Sprite>(path);
            if (sprites == null || sprites.Length == 0)
            {
                Debug.LogWarning($"[CharacterVisual] não encontrou: {path}");
                continue;
            }
            var sprite = sprites[0];

            var go = new GameObject(System.IO.Path.GetFileName(path));
            go.transform.SetParent(transform, false);

            var sr          = go.AddComponent<SpriteRenderer>();
            sr.sprite       = sprite;
            sr.sortingOrder = order++;
            if (flipX) sr.flipX = true;

            if (isHair && !string.IsNullOrEmpty(l.cor_cabelo))      sr.color = HairColor(l.cor_cabelo);
            if (isBrow && !string.IsNullOrEmpty(l.cor_sobrancelha)) sr.color = HairColor(l.cor_sobrancelha);

            // nativeH = altura do canvas completo em unidades (1701/100 = 17.01)
            if (nativeH < 0f)
                nativeH = sprite.rect.height / sprite.pixelsPerUnit;
        }

        if (nativeH > 0f)
        {
            // Personagem visível = linhas 80–1580 do canvas = 1500/1701 do total
            const float visibleFraction = 1500f / 1701f;
            float canvasH = displayHeight / visibleFraction; // altura total do canvas para atingir displayHeight visível
            transform.localScale = Vector3.one * (canvasH / nativeH);
        }

        var baseSR = GetComponent<SpriteRenderer>();
        if (baseSR != null) baseSR.enabled = false;
    }

    static Color HairColor(string hue)
    {
        if (hue == "white")  return Color.white;
        if (hue == "yellow") return new Color(1f, 0.9f, 0.1f);
        if (int.TryParse(hue, out int angle))
            return Color.HSVToRGB((angle / 360f + 1f) % 1f, 0.85f, 0.75f);
        return Color.white;
    }
}
