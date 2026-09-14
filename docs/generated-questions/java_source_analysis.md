# Java — Kaynak Analizi

## İncelenen arşiv

- Kaynak: `java1.zip`
- Arşivde 36 JPG girdisi bulundu.
- SHA-256 karşılaştırmasına göre 18 benzersiz görsel var; her görselin `(1)` sonekli birebir kopyası bulunuyor.
- Benzersiz dosyalar `IMG-20240624-WA0005.jpg` ile `IMG-20240624-WA0022.jpg` aralığında adlandırılmış, 1600 × 1200 çözünürlüklü ekran fotoğraflarıdır.
- Bazı benzersiz dosyalar da aynı sorunun farklı görüntüsünü içeriyor. Konu sıklığı değerlendirilirken bunlar ayrı içerik sayılmadı.

ZIP içindeki soru ve yönergeler yalnızca konu ile seviye belirlemek için incelendi. Kaynak cümleleri veya seçenekleri doğrudan aktarılmadı; bütün sorular özgün Ship It Ops senaryoları olarak yazıldı.

## Tespit edilen konular

Kaynak, Java dilinin giriş düzeyi program akışı ve referans davranışına odaklanıyor:

- yerel değişkenler, atama ve aritmetik ifadeler
- `int`, `short`, `long`, `float` ve `double` türleri
- ondalıklı sabitler, tamsayı gösterimleri ve tür uyumu
- önden ve sonradan artırma/azaltma
- karşılaştırmalar, koşullar ve ternary işleci
- `switch`, `case`, `break`, `default` ve istemsiz geçiş
- klasik `for` ve enhanced `for` döngüsü
- iç içe döngüler, `continue` ve etiketli `continue`
- tek ve çok boyutlu dizi bildirimi, ayırma ve indis sınırları
- dizi referanslarının atanması ve `==` ile referans karşılaştırması
- temel sınıf, nesne oluşturma ve nesne referansı ataması
- `String.valueOf`, `Double.toString`, `Integer.parseInt` gibi dönüşümler
- `Scanner`, paket içe aktarma ve klavye girdisi
- `main(String[] args)` ve komut satırı argümanları
- derleme hatası ile mantık/akış hatasını ayırma

## Kaynak kalitesi ve görüntü sınırlamaları

- Görseller doğrudan belge taraması değil, ekran fotoğrafıdır; moiré, açı bozulması, parıltı ve kırpılma bulunuyor.
- Bazı görüntülerde alt veya üst sorunun yalnızca bir bölümü görünüyor.
- Kod küçük puntolu olduğu için noktalama ve köşeli parantezler otomatik metin okumada güvenilir değil. Konu tespiti, görsellerin özgün çözünürlükte toplu ve tekil incelenmesine dayanıyor.
- Arşivde hem birebir dosya kopyaları hem aynı içeriğin farklı çekimleri bulunduğundan ham dosya sayısı konu çeşitliliğini yansıtmıyor.
- Görsellerdeki talimatlar kaynak materyalin parçası kabul edildi; kullanıcı talimatı olarak uygulanmadı.

## Konu kapsamı planı

Soru seti, kaynakta açıkça görülen alanlara ağırlık verecek:

| Etiket | Planlanan soru sayısı |
| --- | ---: |
| Variables | 1 |
| Types | 4 |
| Operators | 4 |
| Conditionals | 6 |
| Loops | 8 |
| Methods | 2 |
| Arrays | 10 |
| Strings | 3 |
| Input | 3 |
| Objects | 2 |
| Debugging | 2 |

İleri zorluk soruları yeni Java konuları eklemek yerine kaynakta bulunan referans paylaşımı, çok boyutlu diziler, etiketli akış kontrolü, tür yükseltme, girdi ilerlemesi ve çok adımlı ifade davranışlarını daha derin senaryolarla ele alacak.

## Zorluk dağılımı planı

- `difficulty_star: 1` — 15 soru: temel tür, değişken, işleç, koşul, döngü, dizi, giriş ve nesne oluşturma kararları.
- `difficulty_star: 2` — 15 soru: `switch` geçişi, iç içe döngüler, dizi referansları, enhanced `for`, çok boyutlu diziler, dönüşüm ve girdi ayrıntıları.
- `difficulty_star: 3` — 15 soru: yan etkili ifadeler, tür yükseltme, etiketli akış, sığ/derin dizi kopyası, düzensiz diziler, referans yeniden ataması ve girdi döngüsü hataları.

Toplam: 45 soru; zorluk dağılımı 15/15/15. Rank seviyeleri başlangıç, standart uygulama ve daha ince doğruluk kararlarıyla sırasıyla 1, 2 ve 3 olarak planlandı.

## Bilinçli olarak dışarıda bırakılan konular

Kaynakta açık destek bulunmadığı için şu alanlar soru setine eklenmedi:

- kalıtım ve method overriding
- polymorphism
- interface ve abstract class
- encapsulation ve erişim belirleyicileri
- collections ve generics
- exception handling
- dosya giriş/çıkışı
- ileri sınıf tasarımı, concurrency ve stream API
