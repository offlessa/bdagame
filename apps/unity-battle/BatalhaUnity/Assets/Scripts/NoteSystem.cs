using UnityEngine;
using UnityEngine.InputSystem;
using System.Collections;
using System.Collections.Generic;

public class NoteSystem : MonoBehaviour
{
    public const float HitZoneY       = -4f;
    public const float MissThreshold  = 1f;

    [Header("Config")]
    public float noteSpeed     = 5f;
    public float spawnInterval = 1.5f;
    public float spawnY        = 6f;
    public int   totalNotes    = 20;

    [Header("Janelas de timing (segundos)")]
    public float windowPerfect = 0.08f;
    public float windowGood    = 0.18f;
    public float windowOk      = 0.32f;

    [Header("Refs")]
    public BattleManager battleManager;
    public HitFeedback   hitFeedback;
    public GameObject    notePrefab;

    readonly List<Note> _activeNotes = new();
    bool _running;
    int  _spawned;
    int  _processed;

    public void StartNotes()
    {
        if (_running) return;
        _running   = true;
        _spawned   = 0;
        _processed = 0;
        StartCoroutine(SpawnLoop());
    }

    public void StopNotes()
    {
        _running = false;
        StopAllCoroutines();
        foreach (var n in _activeNotes)
            if (n != null) Destroy(n.gameObject);
        _activeNotes.Clear();
    }

    IEnumerator SpawnLoop()
    {
        while (_running && _spawned < totalNotes)
        {
            SpawnNote();
            yield return new WaitForSeconds(spawnInterval);
        }
    }

    void SpawnNote()
    {
        if (notePrefab == null) return;
        var go   = Instantiate(notePrefab, new Vector3(0f, spawnY, 0f), Quaternion.identity);
        var note = go.GetComponent<Note>();
        note.speed      = noteSpeed;
        note.noteSystem = this;
        _activeNotes.Add(note);
        _spawned++;
    }

    void Update()
    {
        if (!_running) return;

        bool tapped = (Keyboard.current    != null && Keyboard.current.spaceKey.wasPressedThisFrame) ||
                      (Touchscreen.current != null && Touchscreen.current.primaryTouch.phase.ReadValue() == UnityEngine.InputSystem.TouchPhase.Began);

        if (tapped) EvaluateTap();
    }

    void EvaluateTap()
    {
        Note  closest     = null;
        float closestDist = float.MaxValue;

        foreach (var note in _activeNotes)
        {
            if (note == null) continue;
            float dist = Mathf.Abs(note.transform.position.y - HitZoneY);
            if (dist < closestDist) { closestDist = dist; closest = note; }
        }

        if (closest == null) return;

        float timeError = closestDist / closest.speed;
        NoteQuality quality;

        if      (timeError <= windowPerfect) quality = NoteQuality.Perfect;
        else if (timeError <= windowGood)    quality = NoteQuality.Good;
        else if (timeError <= windowOk)      quality = NoteQuality.Ok;
        else                                 return;

        RegisterHit(closest, quality);
    }

    public void RegisterHit(Note note, NoteQuality quality)
    {
        _activeNotes.Remove(note);
        Destroy(note.gameObject);
        hitFeedback?.Show(quality);
        battleManager?.OnNoteHit(new NoteResult { quality = quality, isDifficult = note.isDifficult });
        CheckBattleEnd();
    }

    public void RegisterMiss(Note note)
    {
        _activeNotes.Remove(note);
        hitFeedback?.Show(NoteQuality.Miss);
        battleManager?.OnNoteMiss();
        CheckBattleEnd();
    }

    void CheckBattleEnd()
    {
        _processed++;
        if (_processed >= totalNotes && _activeNotes.Count == 0)
        {
            _running = false;
            battleManager?.EndBattle();
        }
    }
}
