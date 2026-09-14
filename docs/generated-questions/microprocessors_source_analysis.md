# Mikroişlemciler - kaynak analizi

## Arşivde bulunan dosyalar

`mikroişlemciler.zip` içinde 23 kaynak dosyası bulundu:

- `mikro büt.pdf` - 1 sayfa
- `mikro final.pdf` - 1 sayfa
- `mikro vize.pdf` - 1 sayfa
- `IMG-20240427-WA0000.jpg` - `IMG-20240427-WA0019.jpg` - 20 ekran görüntüsü

PDF sayfaları ve bütün JPG dosyaları incelendi. Belgelerdeki soru cümleleri, seçenekler, sayısal değerler ve el yazısı çözümler yalnızca konu kapsamını ve ders düzeyini anlamak için kullanıldı; yeni soru metinlerine doğrudan aktarılmadı.

## Tespit edilen konular

- 8086 genel amaçlı yazmaçları: AX, BX, CX, DX ve üst/alt byte parçaları
- segment yazmaçları: CS, DS, SS, ES
- IP, SP, BP, SI ve DI kullanımı
- segment:offset adresleme ve fiziksel adres hesabı
- doğrudan, tabanlı, indisli ve displacement içeren adresleme
- MOV, ADD, ADC, MUL, TEST, CMP ve koşullu dallanma davranışları
- carry, zero, overflow, direction ve interrupt enable bayrakları
- ROR gibi döndürme işlemleri
- BCD toplama ve DAA düzeltmesi
- yığın, PUSH/POP, CALL, RET ve IRET akışı
- maskelenebilir INTR ve maskelenemeyen NMI kesmeleri
- kesme alt yordamına giriş/çıkış ve bağlam koruma
- MOVSB gibi string komutları, SI/DI/CX ve yön bayrağı
- komut işleme aşamaları ve kesme denetimi
- bellek kapasitesi, adres yolu genişliği ve adres aralığı
- HOLD/HLDA ile DMA veri yolu devri
- 8255 PPI kapıları ve mode 0, mode 1, mode 2 davranışları

## Kaynak kalitesi ve OCR sınırlamaları

- Üç PDF taranmış tek sayfalık görüntülerdir ve kullanılabilir metin katmanı yoktur.
- JPG dosyaları bir çevrim içi sınav formunun ekran görüntüleridir; dosyaların bir bölümü aynı soruları farklı kaydırma konumlarında tekrar gösterir.
- Basılı metin çoğunlukla okunaklıdır. PDF'lerdeki bazı el yazısı cevaplar düşük kontrastlıdır ve yalnızca açıkça okunabilen konu işaretleri kullanılmıştır.
- Seçili çevrim içi form seçenekleri doğruluk kanıtı sayılmadı; teknik kapsam, sınav sayfaları ve tutarlı 8086/8255 bilgisi birlikte değerlendirildi.

## Konu kapsamı planı

45 özgün soru şu alanlara dağıtıldı:

- temel 8086 yazmaç seçimi, veri genişliği, MOV/TEST ve basit bayrak kararları
- segment yazmaçları, fiziksel/etkin adres, bellek tanımları ve adres yolu boyutlandırma
- çok byte aritmetik, MUL sonucu, BCD düzeltmesi ve carry/overflow ayrımı
- yığın, CALL/RET/IRET, kesme bağlamı ve bayrağa bağlı dallanma hataları
- MOVSB/REP, yön bayrağı ve örtüşen string kopyalama durumları
- HOLD/HLDA ile DMA sahipliği ve 8255 mode 0/1/2 G/Ç kararları

Etiketler `Register`, `Assembly`, `Instruction`, `Addressing`, `Memory`, `Stack`, `Flag`, `Interrupt`, `I/O`, `Parallel`, `Bus` ve `Debugging` ile sınırlı tutuldu.

## Zorluk dağılımı planı

- `difficulty_star: 1` - 15 soru: doğrudan yazmaç/komut seçimi, temel bayrak anlamı, basit adresleme ve veri tanımı kararları.
- `difficulty_star: 2` - 15 soru: segment:offset hesabı, çok byte aritmetik, stack akışı, string komutları, DMA ve bellek boyutlandırma.
- `difficulty_star: 3` - 15 soru: bayrakların yanlış zamanda tüketilmesi, kesme bağlamı, yığın bozulması, örtüşen kopya, adres decode ve 8255 kip ayrıntıları.

## Bilerek dışarıda bırakılan konular

Kaynaklarda yeterli destek görülmediği için timer/counter programlama, ADC/DAC, seri haberleşme, modern mikrodenetleyici çevre birimleri, pipeline/cache performansı, korumalı mod, sanal bellek ve işletim sistemi tasarımı eklenmedi.

## Bilgisayar Mimarisi kategorisiyle örtüşme

Komut işleme, yazmaçlar, bellek ve veri yolu iki dersin ortak temelidir. Bu set, önceki Bilgisayar Mimarisi içeriğinden ayrışmak için genel register-transfer ve hardwired control ayrıntıları yerine 8086'ya özgü segmentli adresleme, assembly durumu, yığın/kesme akışı, HOLD/HLDA ve 8255 programlanabilir paralel G/Ç kararlarına odaklandı.
