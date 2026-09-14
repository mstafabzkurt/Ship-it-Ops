# Özdevinirler soru seti kalite notları

## Son durum

- Toplam soru: 45
- `category_id`: bütün sorularda `automata_theory`
- `difficulty_star` dağılımı: 1 → 15, 2 → 15, 3 → 15
- `rank_level` dağılımı: 1 → 10, 2 → 20, 3 → 15

## Konu ve etiket dağılımı

| Etiket | Soru sayısı |
| --- | ---: |
| Accept State | 1 |
| CFG | 2 |
| DFA | 2 |
| Equivalence | 2 |
| Grammar | 6 |
| Mealy | 2 |
| Minimization | 3 |
| Moore | 3 |
| NFA | 3 |
| PDA | 4 |
| Regex | 5 |
| Regular Language | 1 |
| Stack | 1 |
| State | 1 |
| Transition | 1 |
| Turing Machine | 4 |
| ε-NFA | 4 |

## Etiket dengesi değerlendirmesi

Konu ailelerine göre dağılım şöyledir:

- sonlu özdevinirler ve düzenli dil temelleri: 13
- düzenli ifadeler: 5
- dilbilgisi ve CFG: 8
- minimizasyon ve durum eşdeğerliği: 5
- Moore ve Mealy makineleri: 5
- PDA ve yığın davranışı: 5
- Turing makinesi: 4

Set yalnızca DFA/NFA sorularına yoğunlaşmıyor. Kaynakta güçlü biçimde görülen dilbilgisi, Moore/Mealy, PDA ve Turing başlıkları toplam 22 soruyla dengeli biçimde temsil ediliyor. Tek soruluk `State`, `Transition`, `Accept State`, `Regular Language` ve `Stack` etiketleri kendi konu ailelerindeki daha ayrıntılı etiketlerle destekleniyor.

## Yapılan başlıca düzeltmeler

- Sağ doğrusal dilbilgisi, Moore/Mealy, PDA ve Turing'e giriş soruları, doğrudan karar biçiminde olsalar da temel DFA/NFA kavramlarından daha ileri oldukları için `rank_level: 2` olarak yeniden sınıflandırıldı.
- Böylece `difficulty_star: 1` içinde temel kavramlar ağırlıkta kalırken konu seviyesi rank alanında daha doğru gösterildi.
- Turing makinesi geçiş kuralı sorusundaki yapay çeldiriciler; yazma-hareket sırasını ve geçiş alanlarını karıştıran gerçekçi modelleme hatalarıyla değiştirildi.
- Bütün sorular pratik doğrulayıcı, durum makinesi, dil modeli veya çalışma konfigürasyonu kararı olarak yeniden kontrol edildi; düz sınav kalıbı bulunmadı.
- Teknik anlam ve yalnızca `optimal_text` seçeneğinin doğru olması korundu.

## Bilerek dışarıda bırakılan konular

Kaynak analizinde açık destek bulunmadığı için karar verilebilirlik/karar verilemezlik problemleri, pumping lemma, LL/LR ayrıştırma, CYK ve hesaplama karmaşıklığı eklenmedi. Biçimsel Myhill-Nerode ispatı, dilbilgisi belirsizliği ve kapanış ispatları da kapsam dışında tutuldu.

## Graph Theory ve Algorithm ile örtüşme

- Durum diyagramları yalnızca giriş simgesi tüketen özdevinir geçişlerini temsil ediyor. Genel çizge bağlılığı, yol, BFS/DFS, MST veya en kısa yol sorusu bulunmuyor.
- NFA-DFA dönüşümü, ε-kapanışı ve minimizasyon soruları kod, veri yapısı, döngü veya çalışma zamanı uygulamasına çevrilmedi. Sorular dil, kabul ve çıktı davranışının korunmasına odaklanıyor.

## Doğrulama sonuçları

- JSON geçerli ve tam olarak 45 nesne içeriyor.
- Zorluk dağılımı 15/15/15; rank dağılımı 10/20/15.
- Zorunlu alanların tamamı mevcut; boş metin bulunmadı.
- Bütün kategori, rank ve zorluk değerleri geçerli.
- Aynı başlık veya aynı soru içinde yinelenen cevap metni bulunmadı.
- Set içinde yakın başlık çifti bulunmadı.
- Graph Theory ve Algorithm 60 soruluk setleriyle yapılan başlık karşılaştırmasında yakın tekrar bulunmadı.
- Kapsam dışı konu ve kategori tarzı kayması taraması temiz geçti.
- Doğru seçeneğin tek başına en uzun olduğu soru sayısı 16/45; seçenek uzunluğu sistematik bir cevap işareti oluşturmuyor.

## Kalan değerlendirme noktaları

- `Grammar` altı, `Regex` beş soruyla tekil etiketler arasında daha yoğundur; bu ağırlık kaynak materyaldeki üretim kuralları ve düzenli ifade sorularını yansıtır.
- İlk genişletmede Turing ve PDA için mevcut soruları tekrarlamayan konfigürasyon/kenar durumu açıları ile düşük frekanslı temel etiketler dengelenebilir.
