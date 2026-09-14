export const SHIP_IT_OPS_SUPPORT_EMAIL = 'mstafabzkurt57@gmail.com';

export const FEEDBACK_OPTIONS = [
  { title: 'Soru Sor', subtitle: 'Ship It Ops hakkında soru gönder', subject: 'Ship It Ops - Soru', body: 'Merhaba, Ship It Ops hakkında bir sorum var:' },
  { title: 'Öneri Gönder', subtitle: 'İyileştirme veya özellik önerisi paylaş', subject: 'Ship It Ops - Öneri', body: 'Merhaba, Ship It Ops için bir önerim var:' },
  { title: 'Soru Öner', subtitle: 'Yeni ders sorusu veya konu bildir', subject: 'Ship It Ops - Soru Önerisi', body: 'Merhaba, Ship It Ops için soru önerim var:\n\nDers / kategori:\nKonu:\nÖnerilen soru veya kaynak:\nNot:' },
] as const;

export function createSupportMailto(subject: string, body: string) {
  return `mailto:${SHIP_IT_OPS_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const LEGAL_DRAFTS = {
  privacy: {
    title: 'Gizlilik Politikası',
    paragraphs: [
      'Bu metin, Ship It Ops\'un mevcut web sürümü için hazırlanmıştır. Ürün geliştikçe güncellenebilir.',
      'Ship It Ops eğitim amaçlı bir oyun ve üründür. Hesap verileri; hesap kimliği, varsa e-posta ve giriş sağlayıcısı, şirket adı, avatar ve çerçeve seçimleri, ilerleme, puanlar ve sıralama verilerini içerebilir. E-posta gönderirsen geri bildirim içeriğin de destek kapsamında işlenebilir.',
      'Bu veriler giriş, kayıt eşitleme, oyun ilerlemesi, sıralama, geri bildirim ve ürün iyileştirme amaçlarıyla kullanılır.',
      'Zorunlu tarayıcı depolama teknolojileri; oturum ve kimlik doğrulama, kayıt eşitleme, tema ve profil tercihleri, onboarding seçimleri ile oyun ilerlemesini korumak için kullanılır.',
      'Analitik ve reklam teknolojileri, kullanıcı açıkça onay vermediği sürece devre dışıdır. Bu teknolojiler gelecekte eklenirse kaydedilmiş gizlilik tercihleri kontrol edilmeden çalıştırılamaz.',
      'Google Analytics, yalnızca analitik izni verirsen uygulamanın nasıl kullanıldığını anlamak ve Ship It Ops deneyimini iyileştirmek amacıyla kullanılabilir.',
      'Analitik olaylara e-posta, hesap ID, şirket adı, geri bildirim metni veya soru metni bilerek eklenmez.',
      `Hesap bölümündeki silme talebi akışı veya destek e-postası (${SHIP_IT_OPS_SUPPORT_EMAIL}) üzerinden silme talebinde bulunabilirsin.`,
    ],
  },
  terms: {
    title: 'Kullanım Koşulları',
    paragraphs: [
      'Bu metin, Ship It Ops\'un mevcut web sürümü için hazırlanmıştır. Ürün geliştikçe güncellenebilir.',
      'Ship It Ops eğitim amaçlıdır. Sorular ve yanıtlar hata içerebilir. Uygulama profesyonel, akademik, hukuki, finansal veya kariyer tavsiyesi sağlamaz.',
      'Hizmeti kötüye kullanma, spam gönderme, tersine mühendislik yapma veya hizmete saldırıda bulunma.',
      'Ürün kuralları doğrultusunda hesap ve ilerleme değiştirilebilir veya silinebilir. İçerikler zaman içinde değişebilir.',
    ],
  },
  licenses: {
    title: 'Lisanslar',
    paragraphs: [
      'Lisanslar ve Kullanılan Assetler',
      'Ship It Ops içinde kullanılan bazı görsel varlıklar üçüncü taraf asset paketlerinden ve ikon kaynaklarından alınmıştır. Bu varlıkların hakları ilgili üreticilerine aittir.',
      'Avatar ikonları:\n• Free Fairy Avatar Icons — Free Game Assets (GUI, Sprite, Tilesets)',
      'Avatar çerçeveleri:\n• Pixel Avatar Frame All — BDragon1727',
      'Flaticon ikonları:\n• Achievement — Magnific\n• Process Improvement — juicy_fish\n• History — Magnific\n• Code — Magnific\n• XRP / Coin — Reddie\n• Check — hqrloveq\n• Delete — hqrloveq\n• Fire — Bahu Icons\n• Info — Magnific',
      'Detaylı kaynak ve lisans kayıtları docs/asset-credits.md dosyasında tutulur.',
    ],
  },
} as const;

export const ASSET_CREDIT_LINKS = [
  {
    label: 'Free Fairy Avatar Icons kaynağını aç',
    url: 'https://free-game-assets.itch.io/free-fairy-avatar-icons-3232-pixel-art',
  },
  {
    label: 'Pixel Avatar Frame All kaynağını aç',
    url: 'https://bdragon1727.itch.io/pixel-avatar-frame-all',
  },
  {
    label: 'Flaticon kaynağını aç',
    url: 'https://www.flaticon.com/',
  },
] as const;
