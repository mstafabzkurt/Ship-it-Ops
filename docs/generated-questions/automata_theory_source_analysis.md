# Özdevinirler - kaynak analizi

## Arşivde bulunan dosyalar

`ozdevinirler.zip` içinde toplam 57 dosya bulundu:

- `2019-2020 Bahar Yarıyılı Özdevinirler Kuramı Arasınav Soruları.pdf` - 11 sayfa
- `Ozdevinir_Vize_Sorular.pdf` - 5 sayfa
- Kök dizinde 23 adet `Ekran görüntüsü 2024-06-19 ....png` dosyası
- `Final` dizininde 23 adet `Screenshot_20240626_...._Gallery.jpg` dosyası
- `IMG-20240425-WA0005.jpg` - `IMG-20240425-WA0010.jpg` aralığında 6 JPG
- `IMG-20250609-WA0001.jpg` - `IMG-20250609-WA0003.jpg` aralığında 3 JPG

İki PDF'nin 16 sayfası ile 55 bağımsız görselin tamamı incelendi. Belgelerdeki soru cümleleri, şekiller, cevap işaretleri ve özgün dizgi örnekleri yeni sorulara aktarılmadı. Kaynaklar yalnızca konu kapsamı, ders seviyesi ve yaygın değerlendirme biçimlerini belirlemek için kullanıldı.

## Tespit edilen konular

- sonlu özdevinir bileşenleri: durum kümesi, giriş alfabesi, başlangıç durumu, kabul durumları ve geçiş fonksiyonu
- DFA'da tam ve tek değerli geçiş davranışı
- NFA'da aynı simge için birden fazla olası geçiş ve varoluşsal kabul
- ε-NFA, ε-kapanışı ve ε-geçişlerinin kaldırılması
- NFA'dan DFA'ya altküme dönüşümünün durum kümeleri
- bir özdevinirin kabul ettiği veya reddettiği dizgilerin yorumlanması
- düzenli ifadeler, birleşim, ardışıklık, Kleene yıldızı ve dil üyeliği
- düzenli diller ve sağ doğrusal dilbilgileri
- Chomsky dilbilgisi türleri; özellikle Tür-0, Tür-1, bağlamdan bağımsız ve düzenli dilbilgisi ayrımı
- bağlamdan bağımsız üretimlerin yapısı
- yok edilebilir ve erişilemeyen değişkenler
- Chomsky ve Greibach normal biçimlerine ilişkin temel üretim kısıtları
- DFA minimizasyonu, erişilemeyen durumların çıkarılması, durum eşdeğerliği ve ayırt edilebilirlik
- Moore ve Mealy makinelerinde çıktıların durum veya geçiş üzerinde tutulması
- Moore/Mealy dönüşümü ve çıktı davranışının korunması
- PDA geçişleri, yığın tepesini okuma, yığına ekleme/çıkarma ve dil kabulü
- Turing makinesi geçiş çizelgesi, yazma-kafa hareketi-durum değişimi ve konfigürasyon takibi
- sonlu özdevinir, PDA ve Turing makinesinin tanıyabildiği dil sınıfları arasındaki temel kapsam farkları

## Kaynak kalitesi ve OCR/görüntü sınırlamaları

- `Ozdevinir_Vize_Sorular.pdf` metin katmanı içeriyor; ancak sözcük aralıkları, λ/ε sembolleri ve bazı üretimler metin çıkarımında birleşti. Konu tespiti sayfa görüntüleriyle doğrulandı.
- 11 sayfalık PDF, Google Forms sonuçlarının sayfa görüntülerinden oluşuyor ve metin çıkarımı sağlamıyor. Bütün sayfalar görsel olarak incelendi.
- PNG ve `Final` JPG grupları büyük ölçüde aynı 2022-2023 sınav akışını tekrar ediyor. Tekrarlanan ekran görüntüleri bağımsız konu kanıtı olarak sayılmadı.
- `IMG-20250609-WA0002.jpg` odak ve açı nedeniyle daha zor okunuyor; aynı sayfanın daha net `WA0001` görüntüsüyle karşılaştırıldı.
- Bazı fotoğrafların kenarları kesik veya başka kâğıtlarla örtülü. Yalnızca açıkça okunabilen başlıklar ve modeller kapsam planına alındı.
- İşaretlenmiş cevaplar doğruluk kaynağı olarak tek başına kullanılmadı; yeni sorular standart kuramsal tanımlara göre yazıldı.

## Konu kapsamı planı

45 özgün soru şu alanlara dağıtılacak:

- DFA/NFA/ε-NFA durum, geçiş, başlangıç ve kabul kararları
- düzenli ifade ile tanınan dilin sınır ve boş dizgi davranışı
- sağ doğrusal ve bağlamdan bağımsız dilbilgisi yapısı
- yok edilebilir/erişilemeyen değişkenler ve normal biçim kontrolleri
- DFA minimizasyonu, ayırt edilebilirlik ve eşdeğerlik koşulları
- Moore/Mealy çıktı konumu ve dönüşümde davranışın korunması
- PDA yığın değişimi, giriş tüketimi ve kabul ölçütü
- Turing makinesi geçişi ve konfigürasyon güncellemesi

Sorular, sınavdaki belirli şekil ve dizgileri tekrar etmek yerine doğrulayıcı, ayrıştırıcı, protokol durumu ve girdi denetimi gibi yeni Ship It Ops senaryolarında özgünleştirilecek.

## Zorluk dağılımı planı

- `difficulty_star: 1` - 15 soru: temel durum/geçiş/kabul kavramları, DFA-NFA farkı, basit düzenli ifade, Moore/Mealy ve PDA/Turing amacı.
- `difficulty_star: 2` - 15 soru: geçiş tablosu tutarlılığı, NFA dalları, ε-kapanışı, altküme dönüşümü, dilbilgisi değişkenleri, minimizasyon ve temel yığın kararı.
- `difficulty_star: 3` - 15 soru: eşdeğerlik/ayırt edilebilirlik, normal biçim ve ε-kaldırma ayrıntıları, PDA kabul sınırları, Turing konfigürasyonu ve Moore/Mealy dönüşüm kenar durumları.

Rank seviyeleri zorlukla uyumlu biçimde temel sorularda 1, standart dönüşüm ve yorum sorularında 2, ince doğruluk ve model sınırı sorularında 3 olarak kullanılacak.

## Bilerek dışarıda bırakılan konular

Kaynaklarda açık ve tekrarlı destek bulunmadığı için karar verilebilirlik/karar verilemezlik problemleri, pumping lemma, düzenli dillerin kapanış ispatları, Myhill-Nerode teoreminin biçimsel ispatı, LL/LR ayrıştırma, CYK, dilbilgisi belirsizliği ve hesaplama karmaşıklığı eklenmeyecek.

## Graph Theory ve Algorithm kategorileriyle örtüşme

- Durum diyagramları yönlü çizge görünümünde olsa da sorular genel düğüm/kenar özelliklerini, bağlılığı, yolu, BFS/DFS'yi, MST'yi veya en kısa yolu sorgulamayacak. Diyagram yalnızca sembol tüketen geçiş sisteminin gösterimidir.
- Dönüşüm ve minimizasyon soruları algoritma kodu, veri yapısı, döngü yürütmesi veya çalışma zamanı analizi olarak yazılmayacak. Odak, eşdeğer dilin ve kabul/çıktı davranışının korunması olacak.
