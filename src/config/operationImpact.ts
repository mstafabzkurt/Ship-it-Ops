import {
  getGameCategory,
  type GameCategoryId,
  type OperationImpactTone,
} from './gameCategories';

type OperationImpactCopy = Readonly<Record<OperationImpactTone, string>>;

interface OperationImpactFamily {
  keywords: readonly string[];
  impact: OperationImpactCopy;
}

export interface OperationImpactInput {
  categoryId: GameCategoryId;
  tag?: string | null;
  title?: string | null;
  resultStatus: OperationImpactTone;
}

const OPERATION_IMPACT_FAMILIES: Readonly<Record<GameCategoryId, readonly OperationImpactFamily[]>> = {
  web_programming: [
    {
      keywords: ['html', 'table', 'tablo', 'colspan', 'rowspan', 'attribute', 'öznitelik'],
      impact: {
        success: 'Doğru özellik seçildi; arayüz tablosu beklenen düzeni korudu.',
        fail: 'Yanlış seçim, tablo düzeninin beklenen sütun/satır yapısını bozabilir.',
        timeout: 'Karar gecikti; tablo düzeni için güvenli seçim yapılamadı.',
        partial: 'Kısmi karar tablo düzenini tamamen güvenceye almadı.',
      },
    },
    {
      keywords: ['link', '<a', 'href', 'target', 'frame', 'sekme', 'yönlendirme'],
      impact: {
        success: 'Doğru seçim, bağlantının hedef davranışını netleştirdi.',
        fail: 'Yanlış seçim, bağlantının beklenmeyen yerde açılmasına yol açabilir.',
        timeout: 'Karar gecikti; bağlantı davranışı belirsiz kaldı.',
        partial: 'Kısmi karar bağlantı akışını tamamen netleştirmedi.',
      },
    },
    {
      keywords: ['http', 'status', 'durum kodu', '404', '401', '500', '200', 'request', 'response'],
      impact: {
        success: 'Doğru karar, HTTP cevabını istemci için net hale getirdi.',
        fail: 'Yanlış karar, istemcinin hatayı yanlış yorumlamasına yol açabilir.',
        timeout: 'Karar gecikti; HTTP cevabı için güvenli seçim yapılamadı.',
        partial: 'Kısmi karar HTTP akışını tamamen netleştirmedi.',
      },
    },
    {
      keywords: ['session', 'cookie', 'oturum', 'çerez'],
      impact: {
        success: 'Doğru karar, oturum davranışını kontrollü tuttu.',
        fail: 'Yanlış karar, oturum veya çerez yönetiminde beklenmeyen davranış oluşturabilir.',
        timeout: 'Karar gecikti; oturum yönetimi belirsiz kaldı.',
        partial: 'Kısmi karar oturum akışını tamamen güvenceye almadı.',
      },
    },
    {
      keywords: ['css', 'style', 'hover', 'selector', 'class', 'id', 'font', 'display'],
      impact: {
        success: 'Doğru seçim, arayüz stilinin beklenen şekilde uygulanmasını sağladı.',
        fail: 'Yanlış seçim, arayüz stilinin hatalı veya eksik uygulanmasına neden olabilir.',
        timeout: 'Karar gecikti; stil davranışı belirsiz kaldı.',
        partial: 'Kısmi karar stil davranışını tamamen netleştirmedi.',
      },
    },
    {
      keywords: ['servlet', 'jsp', 'requestdispatcher', 'forward', 'redirect', 'get', 'post'],
      impact: {
        success: 'Doğru karar, sunucu tarafı web akışını doğru hatta tuttu.',
        fail: 'Yanlış karar, istek yönlendirme veya sunucu cevabında hatalı akış oluşturabilir.',
        timeout: 'Karar gecikti; sunucu tarafı akış için güvenli seçim yapılamadı.',
        partial: 'Kısmi karar sunucu tarafı akışı tamamen netleştirmedi.',
      },
    },
  ],
  operating_systems: [
    {
      keywords: ['process', 'thread', 'süreç', 'iş parçacığı', 'fork', 'context switch'],
      impact: {
        success: 'Doğru karar, süreç/iş parçacığı yönetimini dengede tuttu.',
        fail: 'Yanlış karar, süreç veya iş parçacığı davranışında kararsızlığa yol açabilir.',
        timeout: 'Karar gecikti; çalışma zamanı planı belirsiz kaldı.',
        partial: 'Kısmi karar süreç yönetimini tamamen güvenceye almadı.',
      },
    },
    {
      keywords: ['memory', 'bellek', 'paging', 'page', 'virtual', 'segmentation', 'heap', 'stack'],
      impact: {
        success: 'Doğru karar, bellek yönetimini daha güvenli hale getirdi.',
        fail: 'Yanlış karar, bellek kullanımı veya adresleme tarafında sorun oluşturabilir.',
        timeout: 'Karar gecikti; bellek yönetimi için güvenli seçim yapılamadı.',
        partial: 'Kısmi karar bellek yönetimini tamamen güvenceye almadı.',
      },
    },
    {
      keywords: ['deadlock', 'semaphore', 'mutex', 'lock', 'senkronizasyon', 'critical section', 'race'],
      impact: {
        success: 'Doğru karar, eşzamanlı çalışma riskini kontrol altında tuttu.',
        fail: 'Yanlış karar, yarış durumu veya kilitlenme riskini artırabilir.',
        timeout: 'Karar gecikti; eşzamanlı çalışma riski belirsiz kaldı.',
        partial: 'Kısmi karar senkronizasyon riskini tamamen kapatmadı.',
      },
    },
    {
      keywords: ['scheduling', 'zamanlama', 'round robin', 'priority', 'fcfs', 'sjf', 'cpu'],
      impact: {
        success: 'Doğru karar, işlemci zamanlamasını beklenen politikaya uygun tuttu.',
        fail: 'Yanlış karar, kaynak paylaşımı veya zamanlama sonucunu bozabilir.',
        timeout: 'Karar gecikti; zamanlama politikası için güvenli seçim yapılamadı.',
        partial: 'Kısmi karar zamanlama davranışını tamamen netleştirmedi.',
      },
    },
  ],
  database_systems: [
    {
      keywords: ['index', 'indeks', 'clustered', 'nonclustered', 'performans', 'execution plan', 'maliyet'],
      impact: {
        success: 'Doğru karar, sorgu maliyetini ve erişim yolunu kontrol altında tuttu.',
        fail: 'Yanlış karar, sorgu maliyetini artırabilir veya erişim yolunu bozabilir.',
        timeout: 'Karar gecikti; indeks tercihi için güvenli seçim yapılamadı.',
        partial: 'Kısmi karar sorgu maliyetini tamamen optimize etmedi.',
      },
    },
    {
      keywords: ['sql', 'select', 'where', 'join', 'group by', 'having', 'query', 'sorgu'],
      impact: {
        success: 'Doğru karar, sorgu sonucunu beklenen veriyle hizaladı.',
        fail: 'Yanlış karar, sorgunun eksik veya hatalı veri döndürmesine yol açabilir.',
        timeout: 'Karar gecikti; sorgu hattı için güvenli seçim yapılamadı.',
        partial: 'Kısmi karar sorgu sonucunu tamamen güvenceye almadı.',
      },
    },
    {
      keywords: ['normalization', 'normalizasyon', '1nf', '2nf', '3nf', 'dependency', 'bağımlılık', 'relation', 'ilişki'],
      impact: {
        success: 'Doğru karar, tablo tasarımını veri tekrarı riskine karşı güçlendirdi.',
        fail: 'Yanlış karar, veri tekrarı veya bağımlılık sorunlarını artırabilir.',
        timeout: 'Karar gecikti; veri modeli için güvenli seçim yapılamadı.',
        partial: 'Kısmi karar veri modelini tamamen güvenceye almadı.',
      },
    },
    {
      keywords: ['transaction', 'commit', 'rollback', 'acid', 'isolation', 'foreign key', 'primary key', 'constraint', 'bütünlük'],
      impact: {
        success: 'Doğru karar, veri bütünlüğünü ve transaction güvenliğini korudu.',
        fail: 'Yanlış karar, veri tutarlılığı veya transaction güvenliği tarafında sorun oluşturabilir.',
        timeout: 'Karar gecikti; veri bütünlüğü için güvenli seçim yapılamadı.',
        partial: 'Kısmi karar veri bütünlüğünü tamamen garanti etmedi.',
      },
    },
  ],
};

const EXACT_KEYWORDS = new Set([
  'id', 'get', 'post', 'sql', 'css', 'http', 'request', 'response', 'page',
  '404', '401', '500', '200', 'cpu', 'fcfs', 'sjf', '1nf', '2nf', '3nf',
]);

function createSearchText(value: string | null | undefined) {
  const normalized = typeof value === 'string'
    ? value.normalize('NFKC').toLocaleLowerCase('tr-TR')
    : '';
  return {
    normalized,
    tokens: new Set(normalized.split(/[^\p{L}\p{N}]+/u).filter(Boolean)),
  };
}

function matchesFamily(searchText: ReturnType<typeof createSearchText>, family: OperationImpactFamily) {
  return family.keywords.some((keyword) => {
    const normalizedKeyword = keyword.normalize('NFKC').toLocaleLowerCase('tr-TR');
    if (normalizedKeyword.includes(' ') || normalizedKeyword.includes('<')) {
      return searchText.normalized.includes(normalizedKeyword);
    }
    return normalizedKeyword.length <= 3 || EXACT_KEYWORDS.has(normalizedKeyword)
      ? searchText.tokens.has(normalizedKeyword)
      : searchText.normalized.includes(normalizedKeyword);
  });
}

export function getOperationImpact({
  categoryId,
  tag,
  title,
  resultStatus,
}: OperationImpactInput) {
  const families = OPERATION_IMPACT_FAMILIES[categoryId];
  const titleSearch = createSearchText(title);
  const tagSearch = createSearchText(tag);
  const family = families.find((candidate) => matchesFamily(titleSearch, candidate))
    ?? families.find((candidate) => matchesFamily(tagSearch, candidate));

  return family?.impact[resultStatus] ?? getGameCategory(categoryId).operation.impact[resultStatus];
}
