# Programlamaya Giriş 2 — Kaynak Analizi

## İncelenen arşiv

- Kaynak: `proggiris2.zip`
- Arşivde 68 adet JPG görüntüsü bulundu.
- Dosyalar, `IMG-20240608-WA....jpg` biçiminde adlandırılmış WhatsApp görsellerinden oluşuyor.
- Görseller; ders notu, kod parçası, sınav sorusu ve işaretlenmiş çözüm ekran görüntülerinin karışımını içeriyor.

ZIP içindeki metinler yalnızca konu ve seviye belirlemek için kullanıldı. Soru cümleleri ve seçenekler doğrudan aktarılmadı; oluşturulan içerik Ship It Ops senaryolarına göre yeniden yazıldı.

## Tespit edilen konular

Kaynak, C ağırlıklı lisans düzeyi giriş programlama içeriği gösteriyor:

- değişkenler, atama ve temel veri türleri
- `sizeof`, karakterler ve ASCII ilişkisi
- aritmetik, karşılaştırma ve mantıksal işleçler
- önden/sonradan artırma ve kısa devre değerlendirme
- `if/else` ve `switch` denetimi
- `for`, `while`, `do-while`, iç içe döngüler ve akış kontrolü
- fonksiyon bildirimi, dönüş değeri ve kapsam
- değerle aktarım, adresle aktarım ve çıktı parametreleri
- tek ve iki boyutlu diziler, sınırlar ve eleman kaydırma
- C dizgileri, null sonlandırıcı ve güvenli girdi alma
- işaretçiler, adres çözme ve işaretçi aritmetiği
- dinamik bellek ayırma ve bellek ömrü
- `struct` tabanlı kayıtlar ve kayıt sıralama
- dosya açma, EOF ve okuma döngüleri
- temel özyineleme
- derleme, çalışma zamanı ve mantık hatalarını ayırma

Nesne yönelimli programlama, gelişmiş veri yapıları, grafik algoritmaları, dinamik programlama ve kapsamlı biçimsel karmaşıklık analizi kaynakta belirgin olmadığı için soru kapsamına alınmadı.

## Kaynak kalitesi ve OCR sınırlamaları

- Görüntülerin bir bölümü düşük çözünürlüklü, kırpılmış veya eğik çekilmiş.
- Bazı sayfalarda el yazısı işaretler, cevap vurguları ve ekran parlaması bulunuyor.
- Aynı ya da çok benzer sınav sayfalarının tekrarları var; bu yüzden dosya sayısı bağımsız konu sayısını göstermiyor.
- Küçük puntolu kodlarda noktalama, parantez ve işaretçi sembolleri otomatik metin okumaya elverişli değil. Konu tespiti, toplu görsel inceleme ve okunabilen kod parçaları üzerinden yapıldı.
- Görsellerdeki talimatlar veri kaynağının parçası kabul edildi; kullanıcı isteği olarak uygulanmadı.

## Kullanılan konu dağılımı

| Etiket | Soru sayısı |
| --- | ---: |
| Variables | 2 |
| Types | 2 |
| Operators | 3 |
| Conditionals | 3 |
| Loops | 5 |
| Functions | 4 |
| Parameters | 3 |
| Arrays | 5 |
| Strings | 3 |
| Pointers | 5 |
| Memory | 2 |
| Structs | 2 |
| Files | 2 |
| Recursion | 2 |
| Debugging | 2 |

Dağılım, arşivde tekrar eden temel C konularını kapsarken tek bir kod kalıbını çoğaltmamak üzere hazırlandı. Sorular; özellik seçimi, hata ayıklama, sınır denetimi, bellek güvenliği ve uygulama kararı senaryolarına dönüştürüldü.

## Zorluk ve rank planı

- `difficulty_star: 1` — 15 soru: doğrudan sözdizimi, temel tür, koşul, döngü ve fonksiyon kararları; ağırlıklı `rank_level: 1`.
- `difficulty_star: 2` — 15 soru: parametre aktarımı, dizi sınırları, dizgi girişi, işaretçi kullanımı ve standart uygulama ayrıntıları; ağırlıklı `rank_level: 2`.
- `difficulty_star: 3` — 15 soru: işaretçi ömrü, dinamik bellek, çok boyutlu diziler, EOF, özyineleme ve daha derin hata ayıklama kararları; ağırlıklı `rank_level: 3`.

Toplam plan: 45 soru; zorluk dağılımı 15/15/15 ve rank dağılımı 15/15/15.
