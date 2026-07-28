// ShipIt Inc. kriz senaryoları — Oyun ekranı ve Dashboard aynı veri kaynağını kullanır.

export interface IncidentChoice {
  id: string;
  label: string;
  scoreDelta: number;
  budgetDelta: number;
  outcome: 'success' | 'partial' | 'fail';
  feedback: string;
}

export interface GameIncident {
  id: string;
  tag: string;
  title: string;
  description: string;
  durationSeconds: number;
  /** Süre dolup müdahale edilmezse uygulanacak ceza (Dashboard geri sayımı için). */
  failureScoreDelta: number;
  failureBudgetDelta: number;
  choices: IncidentChoice[];
}

export const GAME_INCIDENTS: GameIncident[] = [
  {
    id: 'db-accidental-drop',
    tag: '🚨 Acil Durum · Production',
    title: 'Production veritabanı yanlışlıkla silindi.',
    description:
      'Gece migration script\'i staging yerine production\'a bağlanmış. `DROP DATABASE` komutu çalıştı ve replikasyon durdu. Müşteri trafiği hâlâ akıyor.',
    durationSeconds: 240,
    failureScoreDelta: -100,
    failureBudgetDelta: -6000,
    choices: [
      {
        id: 'pitr-restore',
        label: 'Point-in-time recovery ile son 15 dakikaya dön',
        scoreDelta: 140,
        budgetDelta: -900,
        outcome: 'success',
        feedback: 'Veri kaybı minimumda tutuldu, servis 12 dakikada ayağa kalktı.',
      },
      {
        id: 'nightly-backup',
        label: 'Gece yedeğinden geri yükle',
        scoreDelta: 95,
        budgetDelta: -500,
        outcome: 'partial',
        feedback: 'Sistem döndü ama son 8 saatlik işlem verisi kayboldu.',
      },
      {
        id: 'rebuild-schema',
        label: 'Şemayı sıfırdan oluştur, veriyi sonra taşırız',
        scoreDelta: -80,
        budgetDelta: -4500,
        outcome: 'fail',
        feedback: 'Saatler süren kesinti ve müşteri kaybı kaçınılmaz oldu.',
      },
    ],
  },
  {
    id: 'ddos-attack',
    tag: '🔥 Güvenlik · Altyapı',
    title: 'Büyük çaplı DDoS saldırısı trafiği boğuyor.',
    description:
      'Ani trafik artışı load balancer\'ı %98 CPU\'da tutuyor. API yanıt süreleri 30 saniyeyi geçti, checkout akışı çöktü.',
    durationSeconds: 180,
    failureScoreDelta: -90,
    failureBudgetDelta: -5000,
    choices: [
      {
        id: 'enable-waf',
        label: 'WAF kurallarını sıkılaştır ve saldırı IP aralıklarını engelle',
        scoreDelta: 130,
        budgetDelta: -250,
        outcome: 'success',
        feedback: 'Saldırı trafiği filtrelendi, gerçek kullanıcılar normale döndü.',
      },
      {
        id: 'auto-scale',
        label: 'Acil yatay ölçeklendirme başlat',
        scoreDelta: 70,
        budgetDelta: -1800,
        outcome: 'partial',
        feedback: 'Trafik absorbe edildi ama bulut faturası ciddi şekilde şişti.',
      },
      {
        id: 'maintenance-mode',
        label: 'Tüm siteyi bakım moduna al',
        scoreDelta: 30,
        budgetDelta: -2200,
        outcome: 'partial',
        feedback: 'Altyapı korundu, ancak satışlar tamamen durdu.',
      },
    ],
  },
  {
    id: 'intern-main-push',
    tag: '⚠️ Deploy · Main Branch',
    title: 'Stajyer main branch\'e hatalı kod pushladı.',
    description:
      'CI pipeline yeşil yandı ama integration testleri atlanmış. Production\'da null pointer exception patladı, error rate %40\'a çıktı.',
    durationSeconds: 150,
    failureScoreDelta: -75,
    failureBudgetDelta: -2800,
    choices: [
      {
        id: 'instant-revert',
        label: 'Son deploy\'u anında geri al (revert)',
        scoreDelta: 145,
        budgetDelta: 0,
        outcome: 'success',
        feedback: 'Hatalı commit geri alındı, servis 3 dakikada normale döndü.',
      },
      {
        id: 'hotfix-forward',
        label: 'Acil hotfix commit\'i ile ileri düzelt',
        scoreDelta: 85,
        budgetDelta: -350,
        outcome: 'partial',
        feedback: 'Sorun çözüldü ama panik içinde yazılan kod teknik borç bıraktı.',
      },
      {
        id: 'wait-for-ci',
        label: 'CI\'ın tekrar koşmasını bekle',
        scoreDelta: -65,
        budgetDelta: -1900,
        outcome: 'fail',
        feedback: 'Beklerken kesinti uzadı, SLO ihlali ve müşteri şikayetleri arttı.',
      },
    ],
  },
  {
    id: 'payment-api-down',
    tag: '💳 Ödeme · Kritik Servis',
    title: 'Ödeme API\'si %100 hata oranına çıktı.',
    description:
      'Stripe webhook imza doğrulaması fail ediyor. Siparişler oluşuyor ama tahsilat yapılamıyor — dakikada ~$2.000 gelir kaybı.',
    durationSeconds: 200,
    failureScoreDelta: -85,
    failureBudgetDelta: -4000,
    choices: [
      {
        id: 'rollback-deploy',
        label: 'Son deploy\'u geri al ve webhook secret\'ı doğrula',
        scoreDelta: 125,
        budgetDelta: -400,
        outcome: 'success',
        feedback: 'Yanlış yapılandırılmış secret düzeltildi, ödemeler tekrar akıyor.',
      },
      {
        id: 'failover-provider',
        label: 'Yedek ödeme sağlayıcısına failover yap',
        scoreDelta: 110,
        budgetDelta: -950,
        outcome: 'success',
        feedback: 'Kesinti kısa sürdü, ancak acil entegrasyon maliyeti oluştu.',
      },
      {
        id: 'debug-prod',
        label: 'Production\'da canlı debug yap',
        scoreDelta: -55,
        budgetDelta: -2600,
        outcome: 'fail',
        feedback: 'Debug logları PII sızdırdı, sorun çözülene kadar gelir durdu.',
      },
    ],
  },
  {
    id: 's3-data-leak',
    tag: '🔓 Güvenlik · Veri İhlali',
    title: 'S3 bucket herkese açık kaldı — müşteri verisi sızdı.',
    description:
      'Güvenlik taraması, müşteri faturaları ve e-posta adreslerini içeren bucket\'ın public read olduğunu tespit etti. Sosyal medyada paylaşımlar başladı.',
    durationSeconds: 300,
    failureScoreDelta: -120,
    failureBudgetDelta: -7500,
    choices: [
      {
        id: 'lockdown-audit',
        label: 'Bucket\'ı anında kilitle, forensics ekibini devreye al',
        scoreDelta: 105,
        budgetDelta: -1600,
        outcome: 'success',
        feedback: 'Sızıntı durduruldu, olay müdahale planı devreye girdi.',
      },
      {
        id: 'notify-customers',
        label: 'Önce müşterilere bildirim gönder, sonra kilitle',
        scoreDelta: 65,
        budgetDelta: -900,
        outcome: 'partial',
        feedback: 'Şeffaflık takdir edildi ama veri o sırada indirilmeye devam etti.',
      },
      {
        id: 'silent-fix',
        label: 'Sessizce kapat, kimse fark etmemiştir umarız',
        scoreDelta: -130,
        budgetDelta: -7000,
        outcome: 'fail',
        feedback: 'Veri ihlali raporlandı, düzenleyici ceza ve itibar kaybı kaçınılmaz oldu.',
      },
    ],
  },
  {
    id: 'redis-cluster-crash',
    tag: '⚡ Altyapı · Cache',
    title: 'Redis cluster tamamen çöktü — oturumlar sıfırlandı.',
    description:
      'Master node OOM kill yedi, replikalar senkronize olamadı. 120.000 aktif kullanıcı logout oldu, sepet verileri kayboldu.',
    durationSeconds: 160,
    failureScoreDelta: -70,
    failureBudgetDelta: -3200,
    choices: [
      {
        id: 'promote-replica',
        label: 'Sağlam replica\'yı acilen promote et',
        scoreDelta: 120,
        budgetDelta: -350,
        outcome: 'success',
        feedback: 'Cluster ayağa kalktı, oturum kaybı sınırlı kaldı.',
      },
      {
        id: 'db-fallback',
        label: 'Oturumları geçici olarak PostgreSQL\'e yönlendir',
        scoreDelta: 90,
        budgetDelta: -450,
        outcome: 'partial',
        feedback: 'Servis ayakta kaldı ama DB yükü ciddi şekilde arttı.',
      },
      {
        id: 'full-restart',
        label: 'Tüm cluster\'ı yeniden başlat',
        scoreDelta: 40,
        budgetDelta: -1500,
        outcome: 'partial',
        feedback: 'Sistem döndü, cold start sırasında ek kesinti yaşandı.',
      },
    ],
  },
  {
    id: 'k8s-disk-pressure',
    tag: '📦 Kubernetes · Kapasite',
    title: 'Node\'lar disk doluluğu yüzünden pod\'ları evict ediyor.',
    description:
      'Log rotasyonu çalışmıyor, container image cache doldu. Production namespace\'inde pod\'lar sırayla ölüyor, HPA yetişemiyor.',
    durationSeconds: 190,
    failureScoreDelta: -80,
    failureBudgetDelta: -3800,
    choices: [
      {
        id: 'purge-and-expand',
        label: 'Eski log/image temizliği yap ve node diskini genişlet',
        scoreDelta: 115,
        budgetDelta: -1100,
        outcome: 'success',
        feedback: 'Disk alanı açıldı, pod\'lar stabil hale geldi.',
      },
      {
        id: 'add-nodes',
        label: 'Acil yeni node pool ekle',
        scoreDelta: 100,
        budgetDelta: -1400,
        outcome: 'success',
        feedback: 'Kapasite sorunu çözüldü, maliyet artışı kabul edilebilir seviyede.',
      },
      {
        id: 'disable-eviction',
        label: 'Eviction\'ı geçici olarak devre dışı bırak',
        scoreDelta: 35,
        budgetDelta: -900,
        outcome: 'partial',
        feedback: 'Pod\'lar ayakta kaldı ama disk dolunca node\'lar çökmeye devam etti.',
      },
      {
        id: 'ignore-alerts',
        label: 'Alarmı sustur, sabah vardiyası halleder',
        scoreDelta: -95,
        budgetDelta: -4200,
        outcome: 'fail',
        feedback: 'Gece boyunca servisler düştü, sabah post-mortem acı verici oldu.',
      },
    ],
  },
];

/** Dashboard'daki aktif kriz kartı — oyun havuzunun ilk senaryosu. */
export const CURRENT_INCIDENT: GameIncident = GAME_INCIDENTS[0];

/** Aynı senaryonun üst üste gelmemesi için rastgele seçim. */
export function pickRandomIncident(excludeId?: string): GameIncident {
  const pool = excludeId ? GAME_INCIDENTS.filter((i) => i.id !== excludeId) : GAME_INCIDENTS;
  return pool[Math.floor(Math.random() * pool.length)];
}
