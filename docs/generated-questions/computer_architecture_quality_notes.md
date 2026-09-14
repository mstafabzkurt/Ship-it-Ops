# Bilgisayar Mimarisi soru seti kalite notları

## Son durum

- Toplam soru: **45**
- Kategori: `computer_architecture`
- `difficulty_star` dağılımı: **1: 15, 2: 15, 3: 15**
- `rank_level` dağılımı: **1: 14, 2: 18, 3: 13**

## Konu ve etiket dağılımı

| Etiket | Soru sayısı |
| --- | ---: |
| Register | 7 |
| Control Unit | 7 |
| Shift | 6 |
| ALU | 5 |
| Instruction | 5 |
| Addressing | 4 |
| Memory | 3 |
| Data Path | 3 |
| Assembly | 3 |
| Clock | 1 |
| Debugging | 1 |

## Yapılan ana düzeltmeler

- Bellek mikroişlemleri, ortak veri yolu, ikiye tümleyen çıkarma, overflow, komut biçimi ve dolaylı adresleme sorularının `rank_level` değerleri kavramsal yüklerine göre yeniden değerlendirildi.
- Basit `CLA` ve `INC` kullanımı gibi doğrudan komut davranışları başlangıç seviyesine çekildi; bellek okuma/yazma yönü ve ALU giriş hazırlığı gibi uygulama ayrıntıları orta seviyeye taşındı.
- Gerçekçi olmayan bazı seçenekler; eski yazmaç değerini kullanma, yanlış veri yolu kaynağını seçme, kontrol sinyalini zamanlama koşulu olmadan etkinleştirme ve PC/SC görevlerini karıştırma gibi uygulanabilir donanım hatalarıyla değiştirildi.
- Fetch, indirect çevrim, IR/DR/AR akışı, AC/E etkileri ve hardwired control unit seçenekleri daha açık teknik karar cümleleri hâline getirildi.
- Doğru seçeneklerin tek doğru cevap olması korunurken diğer seçenekler yanlış fakat uygulanabilir tasarım veya hata ayıklama kararları olarak tutuldu.

## Bilerek dışarıda bırakılan konular

Kaynak kapsamı desteklemediği için cache, pipeline, hazard, CPI, RISC/CISC, endianness ve sanal bellek eklenmedi. Set ayrıca işletim sistemi, genel mikroişlemci çevre birimleri ve ileri assembly konularına genişletilmedi.

## Doğrulama sonuçları

- JSON geçerli ve bütün 45 nesne gerekli dokuz alanı içeriyor.
- Boş alan, geçersiz kategori, geçersiz `difficulty_star` veya geçersiz `rank_level` bulunmadı.
- Zorluk dağılımı 15/15/15 olarak korundu.
- Aynı başlık ve aynı soru içinde yinelenen cevap metni bulunmadı.
- Sözcük kümesi benzerliğiyle yapılan yakın başlık kontrolünde eşik üstü eşleşme bulunmadı.
- Kapsam dışı konu anahtar sözcüğü bulunmadı.
- Doğru cevap 45 sorunun 10'unda tek başına en uzun seçenektir; uzunluk sistematik bir cevap ipucu oluşturmuyor.

## Kalan hususlar

- Kaynak PDF'ler görüntü tabanlı olduğundan konu tespiti görsel okumaya dayanıyor; düşük kontrastlı el yazıları kaynak kapsamının ayrıntısını sınırlıyor.
- AC, E, SC ve yazmaç-referanslı komut adları klasik temel bilgisayar modeline özgüdür. Sorular bu kaynak modelini izler.
- Kaynak yoğunluğu nedeniyle `Register`, `Control Unit` ve `Shift` etiketleri diğer etiketlerden daha sık kullanılıyor.
