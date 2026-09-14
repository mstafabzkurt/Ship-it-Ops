# Çizge Kuramı soru seti kalite notları

## Son durum

- Toplam soru: 45
- `category_id`: bütün sorularda `graph_theory`
- `difficulty_star` dağılımı: 1 → 15, 2 → 15, 3 → 15
- `rank_level` dağılımı: 1 → 15, 2 → 15, 3 → 15

## Konu ve etiket dağılımı

| Etiket | Soru sayısı |
| --- | ---: |
| BFS | 3 |
| Connectedness | 3 |
| Cycle | 4 |
| DFS | 2 |
| Debugging | 1 |
| Directed Graph | 2 |
| Edge | 2 |
| Graph | 3 |
| MST | 3 |
| Matrix | 6 |
| Path | 1 |
| Shortest Path | 6 |
| Spanning Tree | 4 |
| Tree | 4 |
| Vertex | 1 |

## Yapılan başlıca düzeltmeler

- İlk sette birlikte kullanılan `ayrıt` ve `kenar` terimleri, kullanıcı arayüzünde tutarlılık sağlamak için `kenar` olarak birleştirildi.
- İngilizce `traversal`, `predecessor`, `cut` ve `cycle property` ifadeleri; `gezinme`, `öncül`, `kesit` ve `çevrim özelliği` biçiminde Türkçeleştirildi.
- Fazla kısa veya gerçek bir teknik hatayı temsil etmeyen bazı çeldiriciler, olası modelleme ve doğruluk hatalarını anlatan karar cümleleriyle değiştirildi.
- Yoğun çizge gösterimi sorusunda sabit zamanlı komşuluk sorgusu gereksinimi açıklaştırılarak tek doğru seçeneğin komşuluk matrisi olması sağlandı.
- Yönlü erişilebilirlik sorusunda yön koşulu başlığa eklendi; ters yöndeki yolun yeterli sayılması gerçekçi bir çeldirici olarak kullanıldı.
- BFS katmanları, seyrek çizge gösterimi, çevrim ekleme ve kur dönüşümü sorularındaki yapay çeldiriciler daha olası yanlış kararlarla değiştirildi.
- Mevcut zorluk ve rank eşleşmeleri kılavuzla uyumlu bulunduğu için yeniden dağıtım gerekmedi.

## Kapsam sınırları ve kategori örtüşmesi

- Kaynaklarda açık destek bulunmadığı için Euler/Hamilton yolları ve devreleri, düzlemsellik, renklendirme, eşleme, izomorfizm ve iki parçalı çizgeler eklenmedi.
- BFS, DFS, MST ve en kısa yol soruları kod veya çalışma zamanı uygulamasına değil; çizge gösterimi, katman/ebeveyn ilişkisi, ağırlık koşulu ve yapısal doğruluğa odaklanıyor. Böylece Algorithm kategorisinin uygulama ağırlıklı kapsamından ayrılıyor.
- Servis ve bağlantı örnekleri soyut çizge modelidir. TCP/UDP, DNS, paket akışı, yönlendirme protokolü veya ağ ölçümü içermediği için Computer Networks kapsamına kaymıyor.

## Doğrulama sonuçları

- JSON geçerli ve zorunlu dokuz alanın tamamı mevcut.
- Boş metin, geçersiz `rank_level` veya geçersiz `difficulty_star` bulunmadı.
- Aynı başlık ya da aynı soru içinde yinelenen cevap metni bulunmadı.
- Başlık benzerliği taramasında set içinde yakın tekrar bulunmadı.
- Algorithm ve Computer Networks 60 soruluk setleriyle yapılan başlık karşılaştırmasında yakın tekrar bulunmadı.
- Doğru seçeneğin tek başına en uzun olduğu soru sayısı 15/45; uzunluk doğru cevabı sistematik olarak ele vermiyor.
- Kapsam dışı konu ve Algorithm/Computer Networks tarzı terim kayması taraması temiz geçti.

## Kalan değerlendirme noktaları

- `Matrix` ve `Shortest Path` etiketleri altışar soruyla en yoğun alanlardır. Bu ağırlık kaynak materyaldeki komşuluk gösterimi ve ağırlıklı yol sorularını yansıtır.
- İleride set genişletilirse kaynak kapsamı içinde kalmak koşuluyla yol/çevrim karşı örnekleri, bağlı bileşenler ve ağaç yapısal değişmezleri farklı senaryolarla artırılabilir.
