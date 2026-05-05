# React Component Structure

- `app/layout.tsx`: global metadata and CSS.
- `app/page.tsx`: main dashboard page.
- `app/settings/page.tsx`: wearable connection and privacy settings shell.
- `components/FamilyMemberCard.tsx`: member status, privacy-aware metric display, trends.
- `components/MetricCard.tsx`: compact metric tile.
- `components/TrendLine.tsx`: simple SVG sparkline.
- `components/ConnectProviderButtons.tsx`: OAuth entry buttons.
- `lib/normalization.ts`: provider-to-shared-index logic.
- `lib/providers/*`: OAuth, API fetch, and token storage utilities.
- `lib/supabase/*`: browser, server, and service-role clients.
