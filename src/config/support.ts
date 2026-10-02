export const SHIP_IT_OPS_SUPPORT_EMAIL = 'mstafabzkurt57@gmail.com';

export const FEEDBACK_OPTIONS = [
  { title: 'Destek İste', subtitle: 'Bir sorun bildir veya yardım iste', subject: 'Ship It Ops - Destek', body: 'Merhaba, Ship It Ops ile ilgili yardıma ihtiyacım var:\n\nYaşadığım sorun:' },
  { title: 'Öneri Gönder', subtitle: 'Ürünü geliştirmek için fikrini paylaş', subject: 'Ship It Ops - Öneri', body: 'Merhaba, Ship It Ops için bir önerim var:' },
  { title: 'Soru Öner', subtitle: 'Ders için yeni bir soru veya konu öner', subject: 'Ship It Ops - Soru Önerisi', body: 'Merhaba, Ship It Ops için soru önerim var:\n\nDers / kategori:\nKonu:\nÖnerilen soru veya kaynak:\nNot:' },
] as const;

export function createSupportMailto(subject: string, body: string) {
  return `mailto:${SHIP_IT_OPS_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const LEGAL_DRAFTS = {
  privacy: {
    title: 'Gizlilik Politikası',
    paragraphs: [
      'Ship It Ops, Supabase altyapısında hesap kimliğini; varsa e-postanı ve giriş sağlayıcını; şirket adını, avatar ve çerçeve seçimlerini, ilerlemeni, puanlarını ve sıralama bilgilerini saklar. Arkadaşlık, mesajlaşma, soru paylaşımı veya favorileri kullanırsan bu işlemlere ait kayıtlar da tutulur.',
      'Şirket adın, avatarın, çerçeven, kariyer rütben, XP, İtibar ve oyun performansın diğer oyuncuların görebildiği profilinde yer alabilir.',
      'Oturumunu sürdürmek, tercihlerini ve ilerlemeni saklamak için cihazında depolama kullanılır. Hesaba bağlı oyun olayları, oyun akışını ve sorunları anlamak için ayrıca kaydedilir; bu kayıtlar Google Analytics tercihinden bağımsızdır.',
      'Web sürümünde Google Analytics, yalnızca analitik izni verirsen ve hizmet yapılandırılmışsa kullanım olayları ile sayfa görüntülemelerini toplar. Reklam gösterimi ve reklam teknolojileri şu anda aktif değildir. Gizlilik tercihlerini profilinden değiştirebilirsin.',
      'Destek için e-posta gönderirsen mesajını ve paylaştığın bilgileri talebini yanıtlamak için kullanırız.',
      `Hesap bölümünden veya ${SHIP_IT_OPS_SUPPORT_EMAIL} adresinden silme talebi gönderebilirsin. Bu işlem uygulama içinde otomatik silme başlatmaz.`,
    ],
  },
  terms: {
    title: 'Kullanım Koşulları',
    paragraphs: [
      'Ship It Ops, bilgisayar mühendisliği konularını çalışmak için hazırlanmış bir oyundur. Sorular ve açıklamalar hata içerebilir; önemli kararlar için tek kaynak olarak kullanma.',
      'Diğer oyunculara saygılı davran. Spam gönderme, hesapları kötüye kullanma veya hizmetin çalışmasını engelleme.',
      'Oyun içeriği ve özellikler zaman içinde değişebilir. Destek veya hesap silme talebi için profilindeki ilgili bölümü kullanabilirsin.',
    ],
  },
  licenses: {
    title: 'Lisanslar',
    paragraphs: [
      'Ship It Ops içinde üçüncü taraf avatar görselleri, çerçeveler ve Flaticon ikonları kullanılır. Bu varlıkların hakları ilgili üreticilerine aittir. Üreticileri ve kaynak sayfalarını aşağıdaki bağlantılarda bulabilirsin.',
    ],
  },
} as const;

export const ASSET_CREDIT_LINKS = [
  {
    label: 'Free Fairy Avatar Icons — Free Game Assets (GUI, Sprite, Tilesets)',
    url: 'https://free-game-assets.itch.io/free-fairy-avatar-icons-3232-pixel-art',
  },
  {
    label: 'Pixel Avatar Frame All — BDragon1727',
    url: 'https://bdragon1727.itch.io/pixel-avatar-frame-all',
  },
  {
    label: 'Achievement — Magnific kaynağını aç',
    url: 'https://www.flaticon.com/free-icon/achievement_3050455',
  },
  {
    label: 'Process Improvement — juicy_fish kaynağını aç',
    url: 'https://www.flaticon.com/free-icon/process-improvement_7527234',
  },
  {
    label: 'History — Magnific kaynağını aç',
    url: 'https://www.flaticon.com/free-icon/history_1800193',
  },
  {
    label: 'Code — Magnific kaynağını aç',
    url: 'https://www.flaticon.com/free-icon/code_10435180',
  },
  {
    label: 'Coin — Reddie kaynağını aç',
    url: 'https://www.flaticon.com/free-icon/xrp_18911749',
  },
  {
    label: 'Check — hqrloveq kaynağını aç',
    url: 'https://www.flaticon.com/free-icon/check_14090371',
  },
  {
    label: 'Delete — hqrloveq kaynağını aç',
    url: 'https://www.flaticon.com/free-icon/delete_14025477',
  },
  {
    label: 'Fire — Bahu Icons kaynağını aç',
    url: 'https://www.flaticon.com/free-icon/fire_14261136',
  },
  {
    label: 'Info — Magnific kaynağını aç',
    url: 'https://www.flaticon.com/free-icon/info_1445402',
  },
] as const;
