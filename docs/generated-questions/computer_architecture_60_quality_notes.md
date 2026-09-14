# Bilgisayar Mimarisi 60 soru kalite notları

## Son durum

- Toplam soru: **60**
- Kategori: `computer_architecture`
- `difficulty_star` dağılımı: **1: 20, 2: 20, 3: 20**
- `rank_level` dağılımı: **1: 19, 2: 23, 3: 18**
- Gözden geçirilmiş ilk 45 soru değiştirilmeden korundu.

## Konu ve etiket dağılımı

| Etiket | Soru sayısı |
| --- | ---: |
| Register | 9 |
| Control Unit | 9 |
| ALU | 8 |
| Shift | 7 |
| Instruction | 7 |
| Addressing | 6 |
| Data Path | 5 |
| Memory | 4 |
| Assembly | 3 |
| Clock | 1 |
| Debugging | 1 |

## Eklenen konu ve karar açıları

- Bir ortak veri yolu kaynağının aynı saat kenarında birden çok hedef yazmaca dağıtılması
- Kaynak ve hedef load sinyallerinin register transfer yönüne uygun seçilmesi
- İşaretsiz toplamada carry ile taşma izleme
- Mantıksal sola kaydırmada boşalan bitin doldurulması
- Komut biçimindeki yazmaç alanının hedef load sinyaline decode edilmesi
- Aynı kenardaki bağımlı yazmaç aktarımlarında eski ve yeni değer ayrımı
- Bellek yazma öncesinde AR ve DR değerlerinin kararlı hâle getirilmesi
- İkiye tümleyen çıkarmada signed overflow koşulu
- I bitinin decode sonrasında korunması ve etkin adres çevriminin seçilmesi
- Hardwired denetim sinyalinin opcode, zaman adımı ve koşul bitleriyle sınırlandırılması
- Fetch sırasında AR'nin eski PC değerini alması ile PC artışının zamanlanması
- En küçük negatif ikiye tümleyen değerin negatiflenmesindeki temsil taşması
- Dolaylı erişimde pointer okuması ile operand okumasının sıralanması
- SC sıfırlama ve artırma sinyallerinin öncelik çatışması
- Bellekten DR'ye okuma ile DR'den AC'ye aktarım arasındaki saat bağımlılığı

## Bilerek dışarıda bırakılan konular

Kaynak kapsamı desteklemediği için cache, pipeline, hazard, CPI, RISC/CISC, endianness, sanal bellek ve işletim sistemi konuları eklenmedi. Mikroişlemciye özgü port, kesme ve timer davranışları da kapsama alınmadı.

## Doğrulama sonuçları

- JSON geçerli ve tam olarak 60 soru içeriyor.
- Zorluk dağılımı 20/20/20 olarak doğrulandı.
- Bütün `category_id` değerleri `computer_architecture`.
- Bütün `rank_level` ve `difficulty_star` değerleri 1, 2 veya 3.
- Gerekli dokuz alanın tamamı mevcut; boş metin alanı bulunmadı.
- Yinelenen başlık veya aynı soru içinde yinelenen cevap metni bulunmadı.
- Yeni 15 başlık ile ilk 45 başlık arasında sözcük kümesi benzerliği eşiğini aşan yakın eşleşme bulunmadı.
- İlk 45 nesnenin kaynak JSON ile birebir aynı kaldığı doğrulandı.
- Kapsam dışı konu anahtar sözcüğü bulunmadı.
- Doğru cevap 60 sorunun 20'sinde tek başına en uzun seçenektir; seçenek uzunluğu bütün set boyunca tekdüze bir ipucu oluşturmuyor.

## Kalan hususlar

- Kaynak PDF'ler görüntü tabanlı olduğundan kaynak kapsamı görsel incelemeye dayanıyor.
- AC, E, SC ve register-reference komut davranışları klasik temel bilgisayar modelini izliyor; farklı işlemci mimarilerinde aynı yazmaç adları başka anlamlar taşıyabilir.
- Kaynağın odağı nedeniyle `Register`, `Control Unit`, `ALU` ve `Shift` etiketleri daha yoğun temsil ediliyor.
