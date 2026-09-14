# Özdevinirler 60 soru kalite notları

## Son durum

- Toplam soru: 60
- `category_id`: bütün sorularda `automata_theory`
- `difficulty_star` dağılımı: 1 → 20, 2 → 20, 3 → 20
- `rank_level` dağılımı: 1 → 15, 2 → 25, 3 → 20
- Gözden geçirilmiş ilk 45 soru değiştirilmeden korundu.

## Konu ve etiket dağılımı

| Etiket | Soru sayısı |
| --- | ---: |
| Accept State | 1 |
| CFG | 4 |
| DFA | 3 |
| Equivalence | 3 |
| Grammar | 7 |
| Mealy | 4 |
| Minimization | 5 |
| Moore | 3 |
| NFA | 3 |
| PDA | 5 |
| Regex | 5 |
| Regular Language | 2 |
| Stack | 1 |
| State | 2 |
| Transition | 2 |
| Turing Machine | 5 |
| ε-NFA | 5 |

## Yeni eklenen konu ve açılar

### `difficulty_star: 1`

- bütün girdi tüketilmeden ulaşılan kabul durumunun nihai kabul sayılmaması
- DFA'da tek başlangıç durumu zorunluluğu
- tuzak durumun kalan bütün simgelerde kendisine dönmesi
- sonlu bir komut listesinin düzenli dil olarak modellenmesi
- boş girdide Mealy makinesinin geçiş çıktısı üretmemesi

### `difficulty_star: 2`

- gerçek simge geçişinden sonra ε-kapanışın yeniden alınması
- sağ doğrusal dilbilgisinde değişken konumu hatasının reddedilmesi
- başlangıç değişkeninin ε türetmesi durumunda boş dizginin korunması
- minimizasyon bölüntüsünün hedef sınıflara göre inceltilmesi
- Mealy makinesinde giriş ve geçiş çıktısı uzunluklarının eşleşmesi

### `difficulty_star: 3`

- tek ayırt edici girdinin iki DFA'nın eşdeğerliğini çürütmesi
- minimize DFA'ların durum adlarından bağımsız karşılaştırılması
- Chomsky normal biçiminde başlangıç değişkeninin özel ε durumu
- PDA yığın tepesinde kapanış türü uyuşmazlığı
- Turing bandına yazılan simgenin kafa geri döndüğünde korunması

## Etiket dengesi değerlendirmesi

Konu ailelerine göre dağılım şöyledir:

- sonlu özdevinirler ve düzenli dil temelleri: 18
- düzenli ifadeler: 5
- dilbilgisi ve CFG: 11
- minimizasyon ve durum eşdeğerliği: 8
- Moore ve Mealy makineleri: 7
- PDA ve yığın davranışı: 6
- Turing makinesi: 5

Sonlu özdevinir temelleri kategorinin çekirdeği olarak en geniş aileyi oluşturuyor. Diğer 42 soru regex, dilbilgisi, minimizasyon, çıktı makineleri ve daha güçlü makine modellerine dağılıyor. Tekil etiketler içinde en yüksek sayı yedi ile `Grammar`; bu ağırlık kaynak materyaldeki üretim ve dilbilgisi türü sorularıyla uyumludur.

## Bilerek dışarıda bırakılan konular

Kaynak analizinde açık destek bulunmadığı için karar verilebilirlik/karar verilemezlik problemleri, pumping lemma, LL/LR ayrıştırma, CYK ve hesaplama karmaşıklığı eklenmedi. Genel çizge gezinmesi, en kısa yol, MST ve algoritma kodlama soruları da kapsam dışında tutuldu.

## Graph Theory ve Algorithm ile örtüşme

- Durumlar ve geçişler yalnızca özdevinir kabul/çıktı davranışı bağlamında kullanılıyor. Genel çizge yolu, bağlılık, BFS/DFS veya ağaç özelliği sorgulanmıyor.
- ε-kapanış, minimizasyon ve dönüşüm kararları uygulama kodu ya da çalışma zamanı analizi değildir; eşdeğer dilin ve çıktı davranışının korunmasına odaklanır.

## Doğrulama sonuçları

- JSON geçerli ve tam olarak 60 nesne içeriyor.
- Zorluk dağılımı 20/20/20; rank dağılımı 15/25/20.
- Zorunlu alanların tamamı mevcut; boş metin bulunmadı.
- Bütün kategori, rank ve zorluk değerleri geçerli.
- Aynı başlık veya aynı soru içinde yinelenen cevap metni bulunmadı.
- İlk 45 soru JSON nesnesi düzeyinde birebir korundu.
- Yeni 15 soruyla ilk 45 soru arasında yakın başlık eşleşmesi bulunmadı.
- Setin tamamında yakın başlık çifti bulunmadı.
- Graph Theory ve Algorithm 60 soruluk setleriyle yapılan başlık karşılaştırması temiz geçti.
- Kapsam dışı konu ve kategori tarzı kayması taraması temiz geçti.
- Doğru seçeneğin tek başına en uzun olduğu soru sayısı 23/60; seçenek uzunluğu sistematik bir cevap işareti oluşturmuyor.

## Kalan değerlendirme noktaları

- `Grammar` etiketi yedi soruyla en yoğun tekil etikettir. Bu dağılım kaynak kapsamıyla uyumlu olsa da gelecekte ek soru gerekirse düşük frekanslı `State`, `Transition`, `Regular Language` ve `Accept State` açıları tekrar yaratmadan artırılabilir.
- PDA ve Turing soruları kaynakta desteklenen çalışma davranışlarıyla sınırlıdır; karar verilebilirlik veya hesaplama karmaşıklığına genişletilmemelidir.
