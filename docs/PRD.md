# Product Requirements Document

## Product

Family Wellness Dashboard is a private web app where each family member signs in, connects Oura and/or WHOOP through OAuth, chooses privacy settings, and contributes a daily wellness summary to a shared family dashboard.

## Goals

- Give the family a calm shared view of readiness, sleep, HRV, resting heart rate, and activity.
- Preserve consent by letting each person expose exact values, summary labels, or nothing per metric.
- Normalize Oura and WHOOP enough for family-level comparison without pretending the devices measure identically.
- Keep OAuth tokens server-side, encrypted, and inaccessible to the browser.

## Non-Goals

- Medical diagnosis, clinical risk scoring, or emergency alerting.
- Replacing Oura or WHOOP apps for detailed analysis.
- Public social sharing.

## Personas

- Family member: connects their wearable, controls privacy, views family status.
- Family organizer: creates the family group and helps members join.
- Privacy-conscious member: wants summary-only sharing and no alerts.

## MVP Features

- Supabase Auth accounts.
- Family and membership records.
- Oura OAuth authorization-code flow.
- WHOOP OAuth authorization-code flow.
- Daily sync route for provider data.
- Normalized daily metric records.
- Responsive family dashboard.
- Per-metric visibility settings.
- Alert eligibility based on `alerts_enabled`.

## Success Criteria

- A signed-in user can connect one provider without exposing tokens client-side.
- The sync job can create or update `daily_metrics`.
- The dashboard respects visibility levels.
- A family member can opt out of exact numbers and alerts.

## Open Provider Items To Verify Before Production

- Oura V2 endpoint response fields for daily sleep, daily readiness, daily activity, HRV, and RHR.
- WHOOP OAuth app settings, redirect URL registration, and whether `offline` remains the correct refresh-token scope.
- Rate limits and pagination windows for both providers.
- Any current app-review requirements for more than family/internal use.
