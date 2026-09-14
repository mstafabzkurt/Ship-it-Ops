# Çizge Kuramı 60 soru kalite notları

## Son durum

- Toplam soru: 60
- `category_id`: bütün sorularda `graph_theory`
- `difficulty_star` dağılımı: 1 → 20, 2 → 20, 3 → 20
- `rank_level` dağılımı: 1 → 20, 2 → 20, 3 → 20
- Gözden geçirilmiş ilk 45 soru değiştirilmeden korundu.

## Konu ve etiket dağılımı

| Etiket | Soru sayısı |
| --- | ---: |
| BFS | 4 |
| Connectedness | 6 |
| Cycle | 5 |
| DFS | 3 |
| Debugging | 1 |
| Directed Graph | 2 |
| Edge | 3 |
| Graph | 3 |
| MST | 4 |
| Matrix | 7 |
| Path | 2 |
| Shortest Path | 7 |
| Spanning Tree | 5 |
| Tree | 7 |
| Vertex | 1 |

## Yeni eklenen konu ve açılar

### `difficulty_star: 1`

- yalıtılmış düğümün bağlılığa etkisi
- düğüm tekrarı içeren yürüyüş ile basit yol ayrımı
- eksik kenarlı kapalı zincirin çevrim sayılamaması
- yönlü komşuluk matrisinde çıkış komşularının satırdan okunması
- kök değişiminin alttaki yönsüz ağaç yapısını değiştirmemesi

### `difficulty_star: 2`

- farklı iki bağlı bileşen arasına kenar eklenince bileşen sayısının azalması
- `n-1` kenar koşulunun bağlılık olmadan ağaç için yeterli olmaması
- BFS ağacında görünmeyen özgün çizge kenarlarının anlamı
- kökten en kısa yolları veren ağaç ile MST hedefinin ayrılması
- kenar kaldırılmasıyla bileşen sayısı artan köprü kenarın tanınması

### `difficulty_star: 3`

- hiçbir çevrimde bulunmayan kenarın bağlılık üzerindeki etkisi
- köprü kenarın bütün kapsayan ağaçlarda bulunma zorunluluğu
- en kısa yol etiketlerinde yerel eşitsizliklerin yanında yol tanığı gereksinimi
- yönsüz DFS ağacındaki ağaç dışı kenarın ata-soy ilişkisi
- aynı düğüm çifti arasındaki iki farklı basit yolun çevrim oluşturması

## Bilerek dışarıda bırakılan konular

Kaynak kapsamı açık destek vermediği için Euler/Hamilton yolları ve devreleri, düzlemsellik, renklendirme, eşleme, izomorfizm ve iki parçalı çizgeler eklenmedi.

## Algorithm ve Computer Networks ile örtüşme

- BFS ve DFS soruları gezinme koduna, kuyruk/yığın davranışına veya çalışma zamanı uygulamasına girmez; üretilen ağacın yapısal anlamını sorgular.
- MST ve en kısa yol soruları algoritma adımlarını çalıştırmaz; amaç fonksiyonlarını, geçerli sonuç koşullarını ve yapısal farkları karşılaştırır.
- Servis haritası örnekleri soyut çizge modelidir. TCP/UDP, DNS, paket akışı, yönlendirme protokolü veya ağ performansı içeriği kullanılmadı.

## Doğrulama sonuçları

- JSON geçerli ve tam olarak 60 nesne içeriyor.
- Zorluk dağılımı 20/20/20, rank dağılımı 20/20/20.
- Zorunlu alanların tamamı mevcut; boş metin bulunmadı.
- Bütün `category_id`, `difficulty_star` ve `rank_level` değerleri geçerli.
- Aynı başlık veya aynı soru içinde yinelenen cevap metni bulunmadı.
- Yeni sorularla ilk 45 soru arasında yakın başlık eşleşmesi bulunmadı.
- Setin tamamında yakın başlık çifti bulunmadı.
- Algorithm ve Computer Networks 60 soruluk setleriyle yapılan başlık taraması temiz geçti.
- Kapsam dışı konu ve kategori tarzı kayması taraması temiz geçti.
- Doğru seçeneğin tek başına en uzun olduğu soru sayısı 26/60; seçenek uzunluğu sistematik bir doğru cevap işareti oluşturmuyor.

## Kalan değerlendirme noktaları

- `Matrix`, `Shortest Path` ve `Tree` etiketleri yedişer soruyla en yoğun alanlardır. Bu dağılım kaynak analizinde açıkça desteklenen gösterim, ağaç ve yol doğruluğu konularını yansıtır.
- İleride yapılacak genişletmeler kaynak kapsamı değişmeden sürerse az temsil edilen temel `Vertex`, `Path` ve `Edge` açıları artırılabilir; yeni soruların mevcut doğrudan tanım sorularını tekrar etmemesi gerekir.
