export const GUIDED_TOUR_STEPS = [
  {
    route: '/',
    title: 'Ana Sayfa',
    body: 'Şirket durumunu, Kariyer XP’ni, bütçeni, günlük serini ve teknik destek paketini buradan takip edersin.',
    icon: 'home-outline',
  },
  {
    route: '/play',
    title: 'Oyun Merkezi',
    body: 'Bir alan seç, 10 soruluk oturuma gir ve operasyon hedeflerini geçerek yeni yıldız kademelerini aç.',
    icon: 'game-controller-outline',
  },
  {
    route: '/reputation',
    title: 'Kariyer',
    body: 'Kariyer XP ile rütbeni yükseltir, rozetlerden ilerlemeni ve alan hakimiyetini takip edersin.',
    icon: 'trophy-outline',
  },
  {
    route: '/ranking',
    title: 'Sıralama',
    body: 'Tamamladığın oturumlardaki doğru cevaplarınla genel, haftalık ve aylık sıralamada yer alırsın.',
    icon: 'podium-outline',
  },
  {
    route: '/store',
    title: 'Mağaza',
    body: 'Kazandığın Şirket Bütçesi ile jokerler, temalar, avatarlar ve çerçeveler alarak oyun tarzını kişiselleştirirsin.',
    icon: 'bag-handle-outline',
  },
  {
    route: '/profile',
    title: 'Profil',
    body: 'Şirket adını, avatarını, çerçeveni, tema tercihini ve hesap durumunu buradan yönetirsin.',
    icon: 'person-outline',
  },
] as const;

export type GuidedTourRoute = typeof GUIDED_TOUR_STEPS[number]['route'];

export function getGuidedTourStepForPathname(pathname: string): number {
  const normalizedPath = pathname === '/index' ? '/' : pathname;
  return GUIDED_TOUR_STEPS.findIndex(({ route }) => route === normalizedPath);
}
