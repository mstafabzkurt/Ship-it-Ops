# Java — 60 Soru Kalite Notları

## Son durum

- Toplam soru: **60**
- Kategori: tüm sorularda `java`
- İlk 45 incelenmiş soru içerik ve sıra bakımından değiştirilmeden korundu.
- Eklenen soru: **15**

## Zorluk dağılımı

| difficulty_star | Soru sayısı |
| ---: | ---: |
| 1 | 20 |
| 2 | 20 |
| 3 | 20 |

## Rank dağılımı

| rank_level | Soru sayısı |
| ---: | ---: |
| 1 | 18 |
| 2 | 22 |
| 3 | 20 |

Yeni difficulty 1 soruları rank 1, difficulty 2 soruları rank 2 ve difficulty 3 soruları rank 3 olarak eklendi. Dağılım; temel dil kararlarından dizi, giriş ve referans davranışına kademeli geçişi koruyor.

## Konu ve etiket dağılımı

| Etiket | Soru sayısı |
| --- | ---: |
| Variables | 1 |
| Types | 5 |
| Operators | 6 |
| Conditionals | 9 |
| Loops | 9 |
| Arrays | 13 |
| Strings | 5 |
| Input | 4 |
| Objects | 2 |
| Methods | 4 |
| Debugging | 2 |

## Eklenen konu ve karar açıları

- tamsayı bölmesinden önce `double` dönüşümü
- ternary ile iki sayısal değerden birini seçme
- önden ve sonradan azaltmanın gösterilen değere etkisi
- yeni `int` dizilerindeki varsayılan sıfır değerleri
- `Double.toString` ile açık String dönüşümü
- String içerik eşitliği ile referans eşitliğinin ayrılması
- `Scanner` ile ondalıklı token doğrulama ve geçersiz tokenı tüketme
- `switch` case etiketinde derleme zamanı sabiti kullanma
- ilkel tür method parametresindeki değişikliği dönüş değeriyle aktarma
- dizi kapasitesi ile geçerli eleman sayısını ayırma
- etiketli `continue` ile dış `for` güncellemesinin çift artırma etkisi
- kare olmayan matrisin doğru boyutlarla transpozu
- method içinde dizi elemanı değiştirmenin çağırandaki diziye etkisi
- döngü koşulundaki sonradan azaltmanın başarısız kontrolde de çalışması
- String birleştirmede ternary işleminin parantezlenmesi

## Doğrulama sonuçları

- JSON başarıyla ayrıştırıldı.
- Tam olarak 60 soru ve 20/20/20 zorluk dağılımı doğrulandı.
- İlk 45 nesnenin `java_45_questions_reviewed.json` ile birebir aynı olduğu doğrulandı.
- Bütün `category_id` değerleri `java`.
- Bütün rank ve zorluk değerleri 1, 2 veya 3.
- Gerekli alanlarda eksik veya boş değer bulunmadı.
- Tam başlık tekrarı bulunmadı.
- Aynı soru içindeki cevap metinlerinde tekrar bulunmadı.
- Sözcük benzerliği taramasında yeni sorular ile ilk 45 arasında eşik üstü yakın başlık bulunmadı.
- İzin verilen etiketler ve kaynak dışı konu terimleri için yapılan tarama temiz sonuç verdi.

## Kaynak kapsamı nedeniyle dışarıda tutulan konular

- kalıtım ve polymorphism
- interface ve abstract class
- exception handling
- collections
- File I/O
- ileri nesne yönelimli tasarım ve concurrency

## Kalan hususlar

- Kaynak ağırlığı nedeniyle Arrays, Loops ve Conditionals etiketleri diğerlerinden daha yoğun. Yeni sorular String, Input ve Methods kapsamını artırsa da kaynakta az görülen alanlar bilinçli olarak sınırlı tutuldu.
- Zorluk 3 içeriği ileri Java kütüphanelerine geçmeden kontrol akışı, referans yan etkileri ve çok boyutlu dizi sınırlarında yoğunlaşıyor.
