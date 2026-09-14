# Nesne Yönelimli Programlama — Kaynak Analizi

## İncelenen arşiv

- Kaynak: `nyp.zip`
- Arşivde iki PDF bulundu: `NYP Ara Sınav.pdf` ve `NYP.pdf`.
- `NYP Ara Sınav.pdf` 2, `NYP.pdf` 43 sayfa; toplam 45 sayfa incelendi.
- Her iki PDF de görüntü tabanlıdır ve kullanılabilir bir metin katmanı içermez.
- Kaynak kod örnekleri ağırlıklı olarak Ruby dilindedir.

PDF içindeki soru ve yönergeler yalnızca konu, dil ve seviye belirlemek için kullanıldı. Kaynak cümleleri, kod soruları veya seçenekler doğrudan aktarılmadı; oluşturulan içerik özgün Ship It Ops tasarım ve hata ayıklama senaryolarıdır.

## Tespit edilen konular

- sınıf ile nesne ayrımı
- nesne oluşturma ve referansların aynı nesneyi paylaşması
- `initialize` ile kurucu davranışı ve varsayılan parametreler
- örnek değişkenleri (`@alan`) ve sınıf değişkenleri (`@@alan`)
- instance method ile class method (`self.method`) ayrımı
- `attr_reader`, `attr_writer` ve `attr_accessor`
- kapsülleme ve kontrollü durum güncelleme
- `public`, `protected` ve `private` erişim düzeyleri
- `<` ile kalıtım ve üst sınıftan davranış alma
- method overriding ve dinamik method seçimi
- Ruby'de aynı adlı method tanımlarının klasik imza tabanlı overloading oluşturmaması
- `super`, `super()` ve açık argümanla `super(...)` çağrıları
- duck typing üzerinden polymorphism
- operatör methodlarının, özellikle `+` ve `<=>`, yeniden tanımlanması
- modül/mixin kullanımı ve `Comparable` benzeri ortak davranışlar
- kalıtım yerine composition tercihinin tasarım gerekçesi
- `to_s` ve nesnenin metinsel temsili
- görünürlük, method adı, referans paylaşımı ve kurucu zincirindeki yaygın hatalar

## Kaynak kalitesi ve OCR sınırlamaları

- PDF sayfaları sınav ekran görüntüleri, telefon fotoğrafları ve el yazısı çözüm sayfalarının karışımıdır.
- Bazı sayfalar eğik, düşük kontrastlı, kısmen kırpılmış veya yoğun biçimde karalanmıştır.
- Küçük Ruby kodlarında `@`, `@@`, parantez ve noktalama işaretleri OCR için güvenilir değildir.
- Konu tespiti, bütün sayfaların temas sayfalarında incelenmesi ve okunabilen örneklerin daha yakından kontrolüyle yapıldı.
- Aynı veya çok benzer kod sorularının farklı fotoğrafları bulunuyor; konu dağılımında tekrarlar bağımsız içerik sayılmadı.

## Konu kapsamı planı

| Etiket | Soru sayısı |
| --- | ---: |
| Class | 2 |
| Object | 2 |
| Constructor | 4 |
| Encapsulation | 4 |
| Access Modifier | 3 |
| Getter Setter | 3 |
| Inheritance | 4 |
| Overriding | 4 |
| Overloading | 2 |
| Polymorphism | 4 |
| Composition | 3 |
| Static | 3 |
| Super | 3 |
| Debugging | 4 |

Sorular Ruby sözdizimini kopyalamak yerine operasyonel sınıf tasarımı, durum sahipliği, davranış seçimi ve hata ayıklama kararlarına dönüştürülecek. Dil davranışının önemli olduğu yerlerde `initialize`, `attr_reader`, `self`, `super` ve `@@` gibi doğal Ruby terimleri korunacak.

## Zorluk dağılımı planı

- `difficulty_star: 1` — 15 soru: temel sınıf/nesne ayrımı, kurucu amacı, alan erişimi, basit kalıtım ve doğrudan overriding kararları.
- `difficulty_star: 2` — 15 soru: referans paylaşımı, setter doğrulaması, görünürlük, class method, `super`, duck typing ve composition kararları.
- `difficulty_star: 3` — 15 soru: kurucu zinciri, sınıf değişkeni paylaşımı, `super` argüman davranışı, substitutability, operatör methodu sözleşmesi ve kapsülleme sızıntıları.

## Bilinçli olarak dışarıda tutulan konular

- Kaynakta belirgin olmayan UML sınıf diyagramları
- association ve dependency ilişki notasyonları
- Java/C# tarzı interface ve abstract class yapıları
- exception handling, persistence ve veritabanı erişimi
- concurrency ve ileri metaprogramlama
- tasarım kalıplarının ayrıntılı katalogları

## Java kategorisiyle örtüşme

Java kategorisi dil temelleri, diziler, `Scanner`, String dönüşümleri ve kontrol akışını kapsıyor. Bu set aynı giriş konularını tekrarlamayacak; Ruby kaynaklarının desteklediği sınıf tasarımı, kapsülleme, kalıtım, polymorphism, composition ve nesne durumu kararlarına odaklanacak.
