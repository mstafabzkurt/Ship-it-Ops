# Reputation-gated tier unlocks

Tier access is derived from two persisted operation checkpoints per category and difficulty star. Kolay starts open. Orta requires both Kolay checkpoints, and Zor requires both Orta checkpoints. Question-attempt progress remains visible but never grants access by itself.

Each completed 10-question session is assigned to the first unpassed checkpoint in its current tier. Reputation is derived from the currently resolved question results and compared with the tier target: Kolay `+40`, Orta `+50`, and Zor `+60`. Failed checkpoints remain retryable, retain their best net reputation, and passed checkpoints never regress. Once both checkpoints pass, later sessions are ordinary replays and do not create or overwrite qualification checkpoints.

Rollback removes the current question's resolved session result, so its reputation delta disappears from qualification immediately. It also restores the exact pre-answer Career XP, İtibar, and budget snapshot—including clamp and milestone effects—and rolls back the answer, ranking, category-result, and uptime counters before the question is answered again. The replacement answer is then recorded exactly once.

Checkpoint data lives inside the existing `categoryProgress[categoryId][star]` save object:

```ts
operationCheckpoints: {
  1: { bestReputation, passed, attempted, completedAt? },
  2: { bestReputation, passed, attempted, completedAt? },
}
```

The `attempted` marker distinguishes a real zero or negative result from a checkpoint absent in an old save. Save normalization preserves existing question attempts and initializes missing checkpoint data as unattempted and unpassed, so legacy attempt counts cannot accidentally unlock a tier. Checkpoints already marked passed remain grandfathered after balance changes, while their historical `bestReputation` value remains unchanged.

Category mastery requires all six checkpoints across Kolay, Orta, and Zor. Global mastery requires all 18 checkpoints across the three categories.
