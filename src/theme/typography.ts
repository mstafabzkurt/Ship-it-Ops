// Font aileleri — HTML'deki Space Grotesk (başlıklar/marka),
// Inter (gövde metni) ve JetBrains Mono (rakamlar/istatistikler) karşılığı.
// Gerçek isimler @expo-google-fonts paketlerinin export ettiği key'lerdir,
// bunlar useFonts() ile app/_layout.tsx içinde yüklenir.
export const fonts = {
  headingMedium: 'SpaceGrotesk_500Medium',
  headingSemiBold: 'SpaceGrotesk_600SemiBold',
  headingBold: 'SpaceGrotesk_700Bold',

  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',

  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoSemiBold: 'JetBrainsMono_600SemiBold',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

export const fontSizes = {
  xs: 10,
  sm: 11,
  base: 12,
  md: 13,
  lg: 14,
  xl: 15,
  '2xl': 17,
  '3xl': 20,
  '4xl': 22,
} as const;
