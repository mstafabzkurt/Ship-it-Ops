# Mühendislik Ekonomisi soru seti kalite notları

## Sonuç

- Son soru sayısı: **45**
- `category_id`: bütün sorularda `engineering_economics`
- İlk taslaktaki 45 soru korundu; yeni soru eklenmedi veya soru çıkarılmadı.

## difficulty_star dağılımı

| difficulty_star | Soru sayısı |
| --- | ---: |
| 1 | 15 |
| 2 | 15 |
| 3 | 15 |

## rank_level dağılımı

| rank_level | Soru sayısı |
| --- | ---: |
| 1 | 16 |
| 2 | 13 |
| 3 | 16 |

## Konu ve etiket dağılımı

| Etiket | Soru sayısı |
| --- | ---: |
| Alternative Analysis | 3 |
| Annuity | 2 |
| Cash Flow | 5 |
| Compound Interest | 2 |
| Cost | 3 |
| Depreciation | 4 |
| Economic Life | 2 |
| Equivalent Annual Cost | 1 |
| Future Value | 2 |
| Incremental IRR | 5 |
| Interest | 2 |
| IRR | 1 |
| MARR | 2 |
| Present Value | 2 |
| Present Worth | 3 |
| Salvage Value | 2 |
| Tax | 4 |

## Etiket dengesi değerlendirmesi

- Maliyet ve nakit akışı: 8 soru
- Bileşik faiz, dönem oranı, bugünkü ve gelecek değer: 8 soru
- Yıllık seri: 2 soru
- MARR ve PW: 5 soru
- Alternatif analizi, ekonomik ömür ve eşdeğer yıllık maliyet: 6 soru
- IRR ve artan IRR: 6 soru
- Amortisman, vergi ve hurda değeri: 10 soru

En geniş aile amortisman-vergi-hurda değeridir ve toplamın yaklaşık %22'sini oluşturur. PV/FV soruları seti baskılamaz. Maliyet, nakit akışı, dönem-oran hataları, alternatif seçimi ve artan IRR kaynak sınavlarındaki ağırlığa uygun biçimde ayrı açılarla temsil edilir.

## Yapılan başlıca düzeltmeler

- Eşit yıllık seri ve temel birbirini dışlayan alternatif tanıma soruları `rank_level 2` olarak yeniden sınıflandırıldı.
- Doğrudan dönem-oran uyumu, yıllık net akış ve dönem sonu ödeme konuları `rank_level 1` olarak düzeltildi.
- En yüksek bireysel IRR'nin seçim için yeterli olmaması sorusu, daha derin karar yanılgısı olduğu için `rank_level 3` yapıldı.
- Amortisman alt sınırı, toplam amortismanın ilk maliyet ile hurda değeri arasındaki tutarı aşmaması biçiminde kesinleştirildi.
- Artan IRR kararında fark nakit akışının geçerli olması koşulu açıklandı.
- Hızlandırılmış amortismanın zaman değeri avantajı, vergi indiriminin kullanılabildiği durumla sınırlandı.
- Defter değerinin üzerindeki satış için vergi ifadesine uygulanabilir vergi kuralı koşulu eklendi.
- Bütün seçenekler pratik karar dili, tek doğru cevap ve gerçekçi hata olasılığı açısından yeniden kontrol edildi.

## Bilerek dışarıda bırakılan konular

Payback, enflasyon, başabaş, duyarlılık analizi, basit faiz, tahvil/hisse değerleme, makroekonomi ve genel muhasebe eklenmedi. NPV yerine kaynakta görülen PW/bugünkü değer dili kullanıldı. Sorular oyun içi ekonomi, ödül ve bakiye kurallarına kaydırılmadı.

## Kalan kaygılar

- Kaynaklar yalnızca üç sınav ve dört sayfadan oluştuğu için kapsam, bu sınavlarda tekrarlanan yatırım alternatifleri ve vergi sonrası makine karşılaştırmalarıyla sınırlıdır.
- Vergi ve amortisman uygulamaları mevzuata göre ayrıntılanabilir; sorular kaynak seviyesindeki genel mühendislik ekonomisi varsayımlarıyla yazıldı.
- Eşdeğer yıllık maliyet, kaynakta farklı ekonomik ömür karşılaştırmasıyla dolaylı desteklenir ve yalnızca bu bağlamda kullanılır.
