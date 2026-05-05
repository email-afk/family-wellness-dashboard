# Data Normalization Strategy

Oura and WHOOP are not interchangeable instruments. The app normalizes for family communication, not scientific equivalence.

## Shared Indexes

- `recovery_index`: 0-100. WHOOP uses `recovery_score`; Oura uses readiness score as the nearest recovery/readiness equivalent.
- `sleep_index`: 0-100. WHOOP uses sleep performance percentage; Oura uses daily sleep score.
- `activity_index`: 0-100. Oura uses daily activity score; WHOOP strain is scaled from 0-21 to 0-100.
- `status_label`: derived from recovery and sleep averages.

## Status Rules

- `Recovered`: average readiness/sleep >= 75.
- `Normal`: average readiness/sleep >= 55 and < 75.
- `Needs Rest`: average readiness/sleep < 55.
- `Unknown`: not enough data.

## Trend Rules

Use raw HRV RMSSD and RHR for each person over time. Compare a person to their own baseline, not to another family member. HRV values vary widely by age, sex, training state, and device behavior.

## UI Privacy Rules

- `exact`: show numbers.
- `summary`: show status language like "Needs Rest" or "Sleep ok".
- `hidden`: show "Hidden" and do not include alerts.
