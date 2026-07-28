// Renk paleti — dashboard-prototip.html içindeki :root CSS değişkenlerinin
// birebir karşılığı. Tek kaynak burasıdır, bileşenlerde renk hardcode etme.
export const colors = {
  bgBase: '#0B0F17',
  panel: '#151B27',
  panelAlt: '#1D2531',
  border: '#2A3341',

  accentAlert: '#F2A93B',
  accentDanger: '#E5484D',
  accentPositive: '#35C9A3',

  textPrimary: '#EDEFF3',
  textMuted: '#8A93A6',

  // Yardımcı / türetilmiş tonlar
  positiveBg: 'rgba(53,201,163,0.12)',
  positiveBorder: 'rgba(53,201,163,0.35)',
  dangerBg: 'rgba(229,72,77,0.14)',
  dangerBorder: 'rgba(229,72,77,0.4)',
  alertBg: 'rgba(242,169,59,0.10)',
  alertBorder: 'rgba(242,169,59,0.4)',
} as const;

export type ColorToken = keyof typeof colors;
