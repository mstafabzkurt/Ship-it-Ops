# Programming 2 Soru Seti — Kalite Notları

## Son durum

- Toplam soru: **45**
- Kategori: tüm sorularda `programming_2`
- JSON kaynağı: `programming_2_45_questions.json`
- İncelenmiş çıktı: `programming_2_45_questions_reviewed.json`

## Zorluk dağılımı

| difficulty_star | Soru sayısı |
| ---: | ---: |
| 1 | 15 |
| 2 | 15 |
| 3 | 15 |

## Rank dağılımı

| rank_level | Soru sayısı |
| ---: | ---: |
| 1 | 15 |
| 2 | 13 |
| 3 | 17 |

Rank değerleri yalnızca zorluk yıldızını tekrar etmeyecek biçimde yeniden değerlendirildi. Basit `switch` ve `do-while` kararları rank 1'e çekildi. Fonksiyon dönüşü ve C dizgisi kapasitesi rank 2'ye; işaretçiyle güncelleme, işaretçi aritmetiği ve yapı sıralama kararları rank 3'e taşındı.

## Konu ve etiket dağılımı

| Etiket | Soru sayısı |
| --- | ---: |
| Variables | 2 |
| Types | 2 |
| Operators | 3 |
| Conditionals | 3 |
| Loops | 5 |
| Functions | 4 |
| Parameters | 3 |
| Arrays | 5 |
| Strings | 3 |
| Pointers | 5 |
| Memory | 2 |
| Structs | 2 |
| Files | 2 |
| Recursion | 2 |
| Debugging | 2 |

## Yapılan başlıca düzeltmeler

- Bütün sorular pratik programlama, hata ayıklama veya uygulama kararı biçiminde yeniden kontrol edildi.
- Tam sayı bölmesi kararını tekrar eden son soru, kaynak kapsamındaki `unsigned` sayaç taşması ve döngü sonlandırma hatasıyla değiştirildi.
- İşaretçi sorularında `NULL` denetimi, `*` ile değere erişim, sahiplik ve serbest bırakma sonrası kullanım ifadeleri netleştirildi.
- Çıktı parametresinde sahipliği bozan gerçekçi bir hata senaryosu kullanılarak zayıf çeldirici düzeltildi.
- `float` işaretçisinin `printf` ile kullanımı daha açık ve C terminolojisiyle tutarlı yazıldı.
- Doğru cevap uzunluğu tekdüze bırakılmadı: 45 sorunun 28'inde doğru cevap en uzun seçenek, kalan 17 soruda başka bir seçenek daha uzun.
- Başlıklar ve cevaplar doğrudan sınav kalıbı taşımama, kısa olma ve yalnızca `optimal_text` alanının doğru kalması açısından gözden geçirildi.

## Doğrulama sonuçları

- JSON başarıyla ayrıştırıldı.
- Tam olarak 45 soru ve 15/15/15 zorluk dağılımı doğrulandı.
- Gerekli alanlar, boş değerler, kategori ve rank sınırları doğrulandı.
- Tam başlık tekrarı bulunmadı.
- Aynı soru içindeki cevap metinlerinde tekrar bulunmadı.
- Sözcük benzerliğine dayalı yakın başlık taramasında eşik üstü eşleşme bulunmadı.

## Kalan hususlar

- Rank dağılımında rank 3 sayısının biraz yüksek olması, kaynakta işaretçi, dinamik bellek, dosya ve özyineleme sorularının belirgin yer tutmasından kaynaklanıyor.
- Kaynak görsellerin bir bölümü düşük çözünürlüklü veya işaretlenmiş olduğu için özgünlük denetimi birebir OCR karşılaştırmasına dayanmıyor. Sorular kaynak cümlelerini aktarmak yerine tespit edilen kavramlardan özgün senaryolar olarak üretildi.
