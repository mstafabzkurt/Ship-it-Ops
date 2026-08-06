// Renk paleti — dashboard-prototip.html içindeki :root CSS değişkenlerinin
// birebir karşılığı. Tek kaynak burasıdır, bileşenlerde renk hardcode etme.
export const colors = {
  bgBase: '#05070A',       // Kapkaranlık gece mavisi/siyah
  panel: '#0E131F',        // Paneller için derin siber-laci
  panelAlt: '#171E2E',     // Bir tık açık siber-laci
  border: '#1A2D3D',       // Göz yormayan, çok hafif cyan yansımalı kenarlık

  accentAlert: '#F3E600',    // Neon Sarı (Uyarılar için)
  accentDanger: '#FF007F',   // Neon Pembe (Hata ve tehlike için)
  accentPositive: '#00E5FF', // Neon Cyan (Başarı ve doğru cevaplar için)

  textPrimary: '#E0F7FA',  // Tam beyaz yerine, parlayan ekran hissiyatı veren buz beyazı
  textMuted: '#687B8C',    // Sönük, metalik siber-gri

  // Yardımcı / türetilmiş tonlar (Yukarıdaki neonların transparan RGBA versiyonları)
  // Bunlar özellikle arka planlarda ve ince neon çerçevelerde efsane duracak:
  positiveBg: 'rgba(0, 229, 255, 0.12)',     // Şeffaf Cyan arka plan
  positiveBorder: 'rgba(0, 229, 255, 0.35)', // İnce Cyan parlama
  dangerBg: 'rgba(255, 0, 127, 0.14)',       // Şeffaf Pembe arka plan
  dangerBorder: 'rgba(255, 0, 127, 0.4)',    // İnce Pembe parlama
  alertBg: 'rgba(243, 230, 0, 0.10)',        // Şeffaf Sarı arka plan
  alertBorder: 'rgba(243, 230, 0, 0.4)',     // İnce Sarı parlama
} as const;


export type ColorToken = keyof typeof colors;