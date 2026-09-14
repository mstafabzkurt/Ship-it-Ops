# Yazılım Mühendisliği soru seti kalite notları

## Sonuç

- Son soru sayısı: **45**
- `category_id`: bütün sorularda `software_engineering`
- İlk taslaktaki soru sayısı korundu; yeni soru eklenmedi veya soru çıkarılmadı.

## difficulty_star dağılımı

| difficulty_star | Soru sayısı |
| --- | ---: |
| 1 | 15 |
| 2 | 15 |
| 3 | 15 |

## rank_level dağılımı

| rank_level | Soru sayısı |
| --- | ---: |
| 1 | 15 |
| 2 | 15 |
| 3 | 15 |

## Konu ve etiket dağılımı

| Etiket | Soru sayısı |
| --- | ---: |
| Agile | 2 |
| Configuration Management | 3 |
| Dependability | 2 |
| Design | 3 |
| Estimation | 1 |
| Formal Methods | 1 |
| Integration Test | 1 |
| Maintenance | 3 |
| Pattern | 2 |
| Process | 1 |
| Quality | 1 |
| Refactoring | 2 |
| Requirements | 5 |
| Reuse | 1 |
| Risk | 1 |
| Scrum | 1 |
| Testing | 5 |
| Traceability | 2 |
| UML | 1 |
| Unit Test | 1 |
| Use Case | 1 |
| Validation | 2 |
| Verification | 2 |
| Waterfall | 1 |

## Etiket dengesi değerlendirmesi

- Gereksinimler ve izlenebilirlik: 7 soru
- Süreç modelleri, Agile ve Scrum: 5 soru
- Tasarım, UML, kullanım durumu ve desenler: 7 soru
- Test, doğrulama ve geçerleme: 11 soru
- Bakım, refactoring ve yeniden mühendislik: 5 soru
- Yapılandırma yönetimi: 3 soru
- Risk ve tahmin: 2 soru
- Kalite ve güvenilebilirlik: 3 soru
- Yeniden kullanım ve biçimsel yöntem: 2 soru

Test ailesi en geniş gruptur ancak toplamın dörtte birinden azdır. Gereksinim, süreç, tasarım, bakım, yapılandırma, risk ve kalite aileleri birlikte dengeli bir kapsam sağlar. Agile/Scrum ya da gereksinim soruları seti tek başına baskılamaz.

## Yapılan başlıca düzeltmeler

- Ölçülebilir performans isteği açıkça **işlevsel olmayan gereksinim** olarak adlandırıldı.
- Doğrulama sorusundaki tanım ezberi biçimi, teslim kapısında uygulanacak pratik kontrol senaryosuna çevrildi.
- Kullanıcı ihtiyacını sınayan cevapta **geçerleme** terimi tutarlı hale getirildi.
- Bakım sorusunun başlığı doğrudan yaşam döngüsü tanımı sormak yerine üretim değişikliği kararı olarak yazıldı.
- Artırımlı geliştirme sorusu, araç odaklı CI/CD çağrışımı yerine kaynakta desteklenen erken bütünleştirme ve sistem testi kararıyla netleştirildi.
- Seçenekler teknik anlam, karar dili ve tek doğru cevap koşulu açısından yeniden kontrol edildi.
- Rank ve zorluk eşleşmeleri incelendi; temel sorular 1, standart uygulama kararları 2, çok etkenli kararlar 3 düzeyinde korundu.

## Bilerek dışarıda bırakılan konular

Kaynak kapsamı dışında kalan web protokolleri ve framework'leri, veri tabanı sorguları, bulut/mikroservis uygulama ayrıntıları, DevOps araçları, oyun mekaniği, liderlik tablosu ve telemetri tasarımı eklenmedi. Güvenlik yalnızca güvenilebilirlik kalite niteliği bağlamında tutuldu.

## Kalan kaygılar

- Kaynakların iki tanesi görüntü tabanlı olduğu için düşük okunabilirlikteki bazı sınav ayrıntıları konu planına alınmadı.
- Test başlığı kaynakta belirgin biçimde geniştir; bu nedenle diğer ailelerden yüksek olsa da setin dörtte birini aşmaz.
- Biçimsel yöntem ve yeniden kullanım kaynakta desteklenmekle birlikte dar alt başlıklardır; ilk sette birer odak sorusuyla temsil edilir.
