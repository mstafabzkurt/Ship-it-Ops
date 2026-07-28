# ShipIt — Ops Dashboard (Expo Router + TypeScript)

`dashboard-prototip.html` tasarımının Expo Router / React Native / TypeScript karşılığı.

## Kurulum

```bash
npm install
npx expo start
```

## Klasör yapısı

```
shipit-ops-dashboard/
├── app/
│   ├── _layout.tsx              # Root layout — font yükleme (Space Grotesk, Inter, JetBrains Mono)
│   └── (tabs)/
│       ├── _layout.tsx          # Alt navigasyon (bottom-nav karşılığı)
│       ├── index.tsx            # Dashboard ekranı (ana tasarım burada)
│       ├── game.tsx             # Oyun sekmesi (placeholder)
│       ├── reputation.tsx       # İtibar sekmesi (placeholder)
│       ├── store.tsx            # Mağaza sekmesi (placeholder)
│       └── profile.tsx          # Profil sekmesi (placeholder)
├── src/
│   ├── theme/
│   │   ├── colors.ts             # :root CSS değişkenlerinin karşılığı
│   │   └── typography.ts         # Font aileleri / boyutları
│   └── components/
│       ├── Topbar.tsx            # .topbar (marka + durum rozeti)
│       ├── StatusPill.tsx        # .status-pill (pulse animasyonlu)
│       ├── StatsPanel.tsx        # .stats (bütçe / skor / itibar bar)
│       ├── IncidentCard.tsx      # .incident (canlı geri sayım + glow animasyonu)
│       ├── QuickActionCard.tsx   # .card (Hızlı Erişim gridindeki kartlar)
│       └── PlaceholderScreen.tsx # Henüz tasarımı olmayan sekmeler için ortak ekran
├── app.json
├── babel.config.js
├── package.json
└── tsconfig.json
```

## Tasarım → kod eşleşmesi

| HTML/CSS | RN karşılığı |
|---|---|
| `:root` CSS değişkenleri | `src/theme/colors.ts` |
| Google Fonts (`Space Grotesk`, `Inter`, `JetBrains Mono`) | `@expo-google-fonts/*` + `app/_layout.tsx` içinde `useFonts` |
| `.incident::before` glow animasyonu | `Animated.Value` ile interpolate edilen `borderColor` |
| `setInterval` geri sayım (`<script>`) | `IncidentCard` içinde `useState` + `useEffect(setInterval)` |
| `.rep-fill` gradient | `expo-linear-gradient` |
| `.bottom-nav` | `expo-router` `Tabs` (`app/(tabs)/_layout.tsx`) |

## Notlar

- Tüm metinler orijinal HTML ile birebir aynı (Türkçe).
- İkonlar orijinal tasarımdaki gibi emoji olarak bırakıldı; istenirse `lucide-react-native` ile ikon setine geçilebilir.
- `Dashboard` (`app/(tabs)/index.tsx`) dışındaki sekmeler, navigasyon yapısını tamamlamak için basit "yakında" ekranları olarak eklendi — tasarımları geldiğinde `PlaceholderScreen` yerine gerçek bileşenlerle değiştirilebilir.
