# Bilgisayar Mimarisi - Kaynak analizi

## Arşivde bulunan dosyalar

`bilgisayarmimarisi.zip` içinde üç PDF bulundu:

- `Cevap Anahtarı.pdf` - 1 sayfa
- `ünite 4 sorular.pdf` - 4 sayfa
- `ünite 5 sorular.pdf` - 4 sayfa

Toplam dokuz sayfanın tamamı incelendi. PDF içindeki soru, çözüm ve el yazısı notları yalnızca konu, ders düzeyi ve yaygın hata türlerini anlamak için kullanıldı. Soru cümleleri, sayısal örnekler ve çözümler doğrudan aktarılmadı.

## Tespit edilen konular

- yazmaçlar ve register transfer notation
- koşullu yazmaç aktarımı ve saat darbesi
- ortak veri yolu, multiplexer seçimi ve veri yolu genişliği
- bellek okuma/yazma mikroişlemleri ve adres yazmacı
- aritmetik, mantık ve kaydırma mikroişlemleri
- paralel toplayıcı, toplayıcı-çıkarıcı ve ikiye tümleyenle çıkarma
- carry ile signed overflow ayrımı
- mantıksal, aritmetik ve dairesel kaydırma
- komut kelimesi, opcode, yazmaç kodu, adres alanı ve dolaylı adres biti
- doğrudan ve dolaylı adresleme
- temel bilgisayarda AC, PC, AR, DR, IR, E, SC ve R yazmaçları
- fetch, decode, indirect ve execute zamanlama adımları
- bellek-referanslı ve yazmaç-referanslı komutların mikroişlemleri
- `CLA`, `CLE`, `CMA`, `CME`, `CIR`, `CIL`, `INC`, `SPA`, `SNA`, `SZA`, `SZE`, `HLT`
- hardwired control unit, opcode decoder, timing sinyalleri ve Boolean denetim fonksiyonları
- aynı saat adımındaki uyumlu ve çakışan mikroişlemler

## Kaynak kalitesi ve OCR sınırlamaları

- Üç PDF'nin de kullanılabilir metin katmanı yoktur; tüm içerik görüntü tabanlıdır.
- Sayfalarda basılı Türkçe sorular ile İngilizce/Türkçe el yazısı çözümler birlikte bulunuyor.
- Bazı sayfalarda düşük kontrast, silik yazı ve küçük mantık devreleri var. Bütün sayfalar yüksek çözünürlükte render edilerek görsel olarak incelendi.
- Cevap anahtarı, farklı bir kısa sınava ait sınırlı el yazısı içeriyor. Ünite 4 ve Ünite 5 sayfaları konu kapsamının ana kaynağı olarak kullanıldı.

## Konu kapsamı planı

45 özgün soru şu alanlara dağıtıldı:

- temel yazmaç, bellek, ALU, kaydırma ve komut alanı kararları
- veri yolu seçimi, yazmaç kontrolü, adresleme ve komut alma çevrimi
- ikiye tümleyen, carry/overflow, kaydırma etkileri ve komut biçimi bütçesi
- doğrudan/dolaylı komut yürütme, PC/SC denetimi ve aynı çevrimde mikroişlem çakışmaları
- yazmaç-referanslı komutlar ile hardwired denetim sinyallerinin hata ayıklaması

Etiketler kaynak kapsamına göre `Register`, `Clock`, `Memory`, `ALU`, `Shift`, `Instruction`, `Addressing`, `Data Path`, `Control Unit`, `Assembly` ve `Debugging` olarak tutuldu.

## Zorluk dağılımı planı

- `difficulty_star: 1` - 15 soru: temel bileşen amacı, doğrudan yazmaç/bellek aktarımı, basit ALU ve komut alanı kararları.
- `difficulty_star: 2` - 15 soru: veri yolu boyutlandırma, adresleme, carry/overflow ayrımı, fetch sırası ve temel yazmaç-referanslı komut davranışı.
- `difficulty_star: 3` - 15 soru: eşzamanlı mikroişlemler, dolaylı komut yürütme, kontrol sinyali çakışmaları, SC/PC zamanlaması, rotate-through-carry ve denetim mantığı hataları.

## Bilerek dışarıda bırakılan konular

Kaynaklarda belirgin biçimde görülmediği için cache ve bellek hiyerarşisi, pipeline ve hazard, CPI/clock performance hesabı, RISC/CISC karşılaştırması, endianness, sanal bellek, kesme sistemi, I/O organizasyonu ve ileri assembly programlama soruları eklenmedi.
