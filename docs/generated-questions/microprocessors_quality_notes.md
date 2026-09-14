# Mikroişlemciler soru seti kalite notları

## Son durum

- Toplam soru: **45**
- Kategori: `microprocessors`
- `difficulty_star` dağılımı: **1: 15, 2: 15, 3: 15**
- `rank_level` dağılımı: **1: 15, 2: 14, 3: 16**

## Konu ve etiket dağılımı

| Etiket | Soru sayısı |
| --- | ---: |
| Assembly | 8 |
| Memory | 6 |
| Register | 5 |
| Flag | 5 |
| Stack | 4 |
| Addressing | 4 |
| Interrupt | 4 |
| Instruction | 2 |
| Bus | 2 |
| Debugging | 2 |
| Parallel | 2 |
| I/O | 1 |

## Yapılan ana düzeltmeler

- IRET ile kesme bağlamının geri yüklenmesi ve HOLD/HLDA veri yolu devri, birden çok mimari durumu birlikte etkiledikleri için `rank_level: 3` olarak yeniden sınıflandırıldı.
- Carry Flag ile Overflow Flag ayrımı standart bayrak kullanımı seviyesine çekilerek `rank_level: 2` yapıldı.
- Fetch sorusundaki genel bir seçenek, IR'de kalan eski komutun yeni fetch tamamlanmadan yürütülmesi biçiminde daha gerçekçi bir işlem durumu hatasına dönüştürüldü.
- Bellek chip-select çakışması ve 8255 kip seçenekleri, uygulanabilir adres decode ve port yapılandırma hatalarını temsil edecek biçimde iyileştirildi.
- Packed BCD zincirindeki carry kaybının sonucu daha açık ve teknik bir sonuç cümlesiyle ifade edildi.
- Terimler yazmaç, segment, offset, bayrak, yığın, kesme, string komutu, HOLD/HLDA ve paralel G/Ç kullanımı çevresinde tutarlı bırakıldı.

## Bilerek dışarıda bırakılan konular

Kaynak kapsamı yeterli olmadığı için timer/counter çevre birimleri, analog ADC/DAC, seri haberleşme, cache, pipeline, sanal bellek ve işletim sistemi konuları eklenmedi. Java veya üst düzey C programlama içeriği kullanılmadı. `ADC` yalnızca kaynakta desteklenen 8086 add-with-carry assembly komutu anlamında yer alıyor.

## Bilgisayar Mimarisi kategorisiyle örtüşme

Yazmaçlar, bellek ve komut işleme iki kategoride ortak altyapıdır. Bu set genel register-transfer veya hardwired control tasarımına yönelmek yerine 8086 yazmaç çiftleri, segment:offset hesabı, bayrak kullanan assembly akışı, CALL/RET/IRET, kesmeler, string komutları, HOLD/HLDA ve 8255 davranışlarına odaklanarak Bilgisayar Mimarisi setinden ayrışıyor.

## Doğrulama sonuçları

- JSON geçerli ve tam olarak 45 soru içeriyor.
- Zorluk dağılımı 15/15/15 olarak doğrulandı.
- Bütün `category_id` değerleri `microprocessors`.
- Bütün `rank_level` ve `difficulty_star` değerleri 1, 2 veya 3.
- Gerekli dokuz alanın tamamı mevcut; boş metin alanı bulunmadı.
- Yinelenen başlık veya aynı soru içinde yinelenen cevap metni bulunmadı.
- Sözcük kümesi benzerliğiyle yapılan yakın başlık kontrolünde eşik üstü eşleşme bulunmadı.
- Kapsam dışı konu anahtar sözcüğü bulunmadı.
- Doğru cevap 45 sorunun 16'sında tek başına en uzun seçenektir; doğru seçeneklerin tamamında uzunluk ipucu oluşmuyor.

## Kalan hususlar

- Kaynak PDF'ler görüntü tabanlı, JPG dosyalarının bir kısmı da aynı çevrim içi formun tekrar eden ekran görüntüleridir.
- Set bilinçli olarak 8086 ve 8255 odağındadır; farklı mikroişlemci ailelerindeki yazmaç, kesme ve G/Ç davranışlarını genellemez.
- İlk geçişte kaynak yoğunluğunu yansıtmak için assembly ve bellek soruları diğer etiketlerden daha sık kullanıldı.
