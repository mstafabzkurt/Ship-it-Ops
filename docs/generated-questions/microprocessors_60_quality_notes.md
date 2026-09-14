# Mikroişlemciler 60 soru kalite notları

## Son durum

- Toplam soru: **60**
- Kategori: `microprocessors`
- `difficulty_star` dağılımı: **1: 20, 2: 20, 3: 20**
- `rank_level` dağılımı: **1: 20, 2: 19, 3: 21**
- Gözden geçirilmiş ilk 45 soru değiştirilmeden korundu.

## Konu ve etiket dağılımı

| Etiket | Soru sayısı |
| --- | ---: |
| Assembly | 10 |
| Stack | 8 |
| Register | 7 |
| Memory | 7 |
| Flag | 6 |
| Interrupt | 6 |
| Addressing | 5 |
| Bus | 3 |
| Debugging | 3 |
| Instruction | 2 |
| Parallel | 2 |
| I/O | 1 |

## Eklenen konu ve karar açıları

- AH güncellenirken AL değerinin korunması ve AX alt yazmaç ilişkisi
- Kod taşındığında CS:IP çiftinin birlikte doğrulanması
- Word PUSH ve POP sırasında SP'nin ikişer değişmesi
- CMP komutunun operandları değiştirmeden yalnızca bayrakları güncellemesi
- Far CALL sırasında dönüş CS:IP bağlamının yığında korunması
- Yakın CALL sonrasında SP değerinin hesaplanması
- CX sıfırken `REP MOVSB` komutunun kopyalama yapmaması
- Geriye kopyalama sonrasında Direction Flag durumunun çağırana sızmasının önlenmesi
- İki 8K×8 çiple 16K×8 alan kurarken adres ve chip-select paylaşımı
- Farklı segment:offset çiftlerinin aynı fiziksel adrese düşebilmesi
- Kesme alt yordamında RETF yerine IRET kullanımı ve FLAGS'in geri yüklenmesi
- Bağlam saklanmadan kesmelerin yeniden açılmasının iç içe kesme riski
- HOLD yüksek kaldığı sürece HLDA ve veri yolu sahipliğinin korunması
- Çok byte toplamada aradaki TEST komutunun Carry Flag zincirini bozması

## Bilerek dışarıda bırakılan konular

Kaynak kapsamı yeterli olmadığı için timer/counter çevre birimleri, analog ADC/DAC, seri haberleşme, cache, pipeline, sanal bellek ve işletim sistemi konuları eklenmedi. Java veya üst düzey C programlama içeriği kullanılmadı. `ADC` yalnızca 8086 add-with-carry assembly komutu olarak kullanıldı.

## Bilgisayar Mimarisi kategorisiyle örtüşme

Bellek adresleme, veri yolu ve yazmaçlar iki kategoride ortak temeldir. Yeni sorular genel register-transfer, ALU devresi veya hardwired control konularına yönelmedi; 8086 alt yazmaçları, CS:IP, segment alias, SP/yığın etkileri, FLAGS zinciri, kesme dönüşü, string komutları, HOLD/HLDA ve bellek çipi seçimine odaklandı.

## Doğrulama sonuçları

- JSON geçerli ve tam olarak 60 soru içeriyor.
- Zorluk dağılımı 20/20/20; eklenen 15 sorunun kendi dağılımı 5/5/5.
- Bütün `category_id` değerleri `microprocessors`.
- Bütün `rank_level` ve `difficulty_star` değerleri 1, 2 veya 3.
- Gerekli dokuz alanın tamamı mevcut; boş metin alanı bulunmadı.
- Yinelenen başlık veya aynı soru içinde yinelenen cevap metni bulunmadı.
- Yeni başlıklarla ilk 45 başlık arasında sözcük kümesi benzerliği eşiğini aşan eşleşme bulunmadı.
- İlk 45 nesnenin kaynak reviewed JSON ile birebir aynı kaldığı doğrulandı.
- Kapsam dışı konu anahtar sözcüğü bulunmadı.
- Doğru cevap 60 sorunun 23'ünde tek başına en uzun seçenektir; doğru seçenek uzunluğu set boyunca tekdüze bir ipucu oluşturmuyor.

## Kalan hususlar

- Kaynakların büyük bölümü görüntü tabanlı ve bazı ekran görüntüleri aynı soruları tekrarlıyor.
- İçerik 8086 gerçek kip ve 8255 bağlamına dayanıyor; başka işlemci ailelerine doğrudan genellenmemeli.
- Kaynak yoğunluğunu yansıtmak için Assembly, Stack, Register ve Memory etiketleri diğerlerinden daha sık temsil ediliyor.
