# Nesne Yönelimli Programlama 60 soru kalite notları

## Son durum

- Toplam soru: 60
- `difficulty_star` dağılımı: 1 yıldız 20, 2 yıldız 20, 3 yıldız 20
- `rank_level` dağılımı: seviye 1 için 15, seviye 2 için 21, seviye 3 için 24
- Kategori: Tüm kayıtlarda `object_oriented_programming`
- Gözden geçirilmiş ilk 45 soru içerik ve sıra bakımından değişmeden korundu.

## Konu ve etiket dağılımı

| Etiket | Adet |
| --- | ---: |
| Class | 2 |
| Object | 2 |
| Constructor | 5 |
| Encapsulation | 5 |
| Access Modifier | 5 |
| Getter Setter | 4 |
| Static | 5 |
| Inheritance | 4 |
| Overriding | 5 |
| Polymorphism | 6 |
| Debugging | 5 |
| Overloading | 3 |
| Composition | 5 |
| Super | 4 |

## Eklenen konu ve karar açıları

- `initialize` içinde parametreyi örnek değişkenine aktarmama hatası ve `new` üzerinden kurucu çalıştırma
- Salt okunur sayaç ile kontrollü durum değişikliği
- Nesne durumuna bağlı davranışta class method ve instance method ayrımı
- Public işlem ile private yardımcı method arasındaki API sınırı
- Doğrulama ve normalizasyon yapan özel setter tasarımı
- Parantezsiz `super` çağrısının fazla argüman iletmesi ve açık `super(name)` seçimi
- Override edilen methodda boolean dönüş sözleşmesini koruma
- Bileşimle verilen paylaşılan bağımlılığın yaşam döngüsü ve sahipliği
- Duck typing kullanan üçüncü taraf eklentilerinde davranış sözleşmesini kayıt sınırında denetleme
- `@@` sınıf değişkeninin kalıtım ağındaki ortak durum etkisi ve class instance variable ile yalıtım
- Aynı methodu sağlayan mixin'lerin çakışmasını açık sınıf davranışıyla çözme
- Private method çağrısında açık alıcı kısıtı
- Dışarıdan verilen değiştirilebilir nesne referansını kopyalama veya dondurma
- `Comparable` için `<=>` methodunun karşılaştırılamayan türde `nil` döndürmesi

## Bilerek dışarıda bırakılan konular

Kaynak kapsamı nedeniyle UML, association/dependency notasyonu, Java/C# tarzı interface yapıları, abstract class, Java sözdizimi, `Scanner`, dizi ve `String` sözdizimi soruları eklenmedi. Exception handling, persistence, concurrency ve ileri metaprogramlama da kapsama alınmadı.

## Doğrulama sonuçları

- JSON ayrıştırması başarılı ve toplam 60 kayıt doğrulandı.
- Zorluk dağılımı 20/20/20 olarak doğrulandı.
- Tüm `category_id`, `difficulty_star` ve `rank_level` değerleri geçerli.
- Gerekli alanların tamamı mevcut; boş metin bulunmuyor.
- Birebir yinelenen veya yakın eşleşen başlık bulunmadı.
- Aynı soru içinde yinelenen cevap metni bulunmadı.
- İlk 45 soru kaynak reviewed JSON ile birebir aynı.
- Kapsam dışında bırakılan konu ifadeleri bulunmadı.
- Doğru seçeneğin tek başına en uzun olduğu soru sayısı 27/60; seçenek uzunluğu bütün sette sabit bir doğru cevap işareti oluşturmuyor.

## Kalan hususlar

- Kaynak PDF'ler görüntü tabanlı olduğu için konu kapsamı önceki görsel inceleme ve kaynak analizine dayanıyor.
- `Static` etiketi Ruby'deki bir anahtar sözcüğü değil; class method, class variable ve class instance variable kararlarını grupluyor.
- İleri seviye sorular Ruby method arama, görünürlük, sahiplik ve davranış sözleşmesi ayrıntılarını ölçüyor; dil sürümüne bağlı olabilecek private açık alıcı senaryosu soru metninde bu bağlam belirtilerek sınırlandı.
