using UnityEngine;

public class Note : MonoBehaviour
{
    public float speed = 5f;
    public bool isDifficult = false;

    [HideInInspector] public NoteSystem noteSystem;

    void Update()
    {
        transform.position += Vector3.down * speed * Time.deltaTime;

        if (transform.position.y < NoteSystem.HitZoneY - NoteSystem.MissThreshold)
        {
            noteSystem?.RegisterMiss(this);
            Destroy(gameObject);
        }
    }
}
