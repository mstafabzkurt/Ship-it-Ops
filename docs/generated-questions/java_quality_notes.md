# Java Soru Seti — Kalite Notları

## Son durum

- Toplam soru: **45**
- Kategori: tüm sorularda `java`
- Kaynak: `java_45_questions.json`
- İncelenmiş çıktı: `java_45_questions_reviewed.json`

## Zorluk dağılımı

| difficulty_star | Soru sayısı |
| ---: | ---: |
| 1 | 15 |
| 2 | 15 |
| 3 | 15 |

## Rank dağılımı

| rank_level | Soru sayısı |
| ---: | ---: |
| 1 | 13 |
| 2 | 17 |
| 3 | 15 |

Rank değerleri zorluk yıldızını doğrudan tekrar etmek yerine kavramsal yükü yansıtacak biçimde düzenlendi. Dizi oluşturma, `Scanner`, temel nesne oluşturma ve `switch` geçişi rank 2 olarak değerlendirildi. Komut satırı doğrulaması ve kesin atama denetimi rank 3'e taşındı.

## Konu ve etiket dağılımı

| Etiket | Soru sayısı |
| --- | ---: |
| Variables | 1 |
| Types | 4 |
| Operators | 4 |
| Conditionals | 6 |
| Loops | 8 |
| Arrays | 10 |
| Strings | 3 |
| Input | 3 |
| Objects | 2 |
| Methods | 2 |
| Debugging | 2 |

## Yapılan başlıca düzeltmeler

- Soruların tamamı pratik Java geliştirme, hata ayıklama veya program akışı kararı olarak yeniden kontrol edildi.
- Rank değerleri; temel sözdizimi, standart referans/dizi kullanımı ve ince kontrol akışı hataları arasında yeniden dağıtıldı.
- Yapay veya doğrudan anlamsız kalan çeldiriciler; veri kaybı, yanlış dallanma, sınır aşımı, referans paylaşımı, sessiz daraltma ve hatalı geçici çözüm gibi gerçekçi Java hatalarıyla değiştirildi.
- Komut satırı argümanı sorusunda uzunluk ve sayısal biçim denetimi açık hale getirildi.
- Method parametresine yeni dizi atamanın çağıranın referansını değiştirmediği senaryoda sınır aşımı sonucu daha gerçekçi yazıldı.
- Yerel değişkenin kesin atanma zorunluluğu ile alan değişkeninin varsayılan değeri arasındaki risk netleştirildi.
- Doğru cevapların tümü en uzun seçenek değil: 45 sorunun 24'ünde `optimal_text` en uzun, 21 soruda başka bir seçenek daha uzun.

## Doğrulama sonuçları

- JSON başarıyla ayrıştırıldı.
- Tam olarak 45 soru ve 15/15/15 zorluk dağılımı doğrulandı.
- Bütün `category_id` değerleri `java`.
- Rank ve zorluk değerleri yalnızca 1, 2 veya 3.
- Gerekli alanlarda eksik veya boş değer bulunmadı.
- Tam başlık tekrarı bulunmadı.
- Aynı soru içindeki cevap metinlerinde tekrar bulunmadı.
- Sözcük benzerliği taramasında eşik üstü yakın başlık bulunmadı.
- Kaynak dışı konu terimleri ve izin verilmeyen etiketler için yapılan tarama temiz sonuç verdi.

## Kaynak kapsamı nedeniyle dışarıda tutulan konular

- kalıtım ve polymorphism
- interface ve abstract class
- exception handling
- collections
- File I/O
- ileri sınıf tasarımı ve concurrency

## Kalan hususlar

- Kaynak az sayıda benzersiz sınav ekranından oluştuğu için Arrays, Loops ve Conditionals etiketleri diğer konulardan daha yoğun temsil ediliyor.
- Zorluk 3 soruları ileri Java API'lerine geçmeden, kaynakta görülen yapıların çok adımlı ve kenar durumlarına odaklanıyor. Bu nedenle kapsam derinliği özellikle dizi referansları ve kontrol akışında yoğunlaşıyor.
