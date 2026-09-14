# Algoritma kaynak analizi

## İncelenen dosyalar

`algoritma.zip` içinde iki üst düzey kaynak bulundu:

- `BIL204_ARASINAV.pdf`: Tek sayfalık, 23.04.2020 tarihli BİL204 Algoritmalar ara sınavı.
- `Algoritmalar Çıkmış Sorular.zip`: Açıldığında üç görüntü klasörü içeriyor.
  - `Çıkmış Sorular/Final`: 20 PNG (`1.png` - `20.png`)
  - `Çıkmış Sorular/Vize`: 21 PNG (`1.png` - `21.png`)
  - `Çıkmış Sorular/Online Çıkmış Sorular`: 54 JPG (`IMG-20240424-WA0043.jpg` ile `IMG-20240426-WA0033.jpg` ad grupları)

Toplamda bir PDF sayfası ve 95 görüntü incelendi. Online klasöründeki görüntülerin önemli bir bölümü Final ve Vize sorularının ekran kaydı veya işaretlenmiş tekrarlarıdır.

## Algılanan konu ve seviye

Kaynak lisans düzeyinde bir algoritmalar dersine ait. Ağırlık verilen konular:

- Zaman ve alan karmaşıklığı; ardışık ve iç içe döngüler
- Big-O, Big-Theta ve Big-Omega; büyüme oranlarının karşılaştırılması
- En iyi, ortalama ve en kötü durum analizi
- Özyineleme, yineleme bağıntıları ve özyineleme ağacı
- Doğrusal arama, ikili arama ve doğrudan adresleme
- Karma tablolar ve açık adresleme
- Araya sokma, kabarcık, seçmeli, hızlı, birleştirmeli, yığın, sayma ve taban sıralaması
- Böl ve yönet; Karatsuba ve Strassen
- BFS ve DFS
- Dijkstra ve Bellman-Ford ile en kısa yol
- Prim, Kruskal ve diğer minimum kapsayan ağaç yaklaşımları
- Huffman kodlama ve açgözlü tasarım
- Algoritma doğruluğu ve girdi durumlarının performansa etkisi

Dinamik programlama ve backtracking kaynak görüntülerinde belirgin bir sınav konusu olarak görünmedi. İlk soru setinde kaynak kapsamını yapay biçimde genişletmemek için bu iki alan kullanılmadı.

## Kaynak kalite notları

- Ara sınav PDF'i okunaklı ve metin katmanı içeriyor; soru düzeni görsel olarak da kontrol edildi.
- Final ve Vize PNG'lerinin çoğu okunaklı, ancak bazı kod blokları küçük yazılmış.
- Online JPG'ler tarayıcı veya video ekran görüntüsü biçiminde; bir bölümünde düşük ölçek, kırpılmış seçenekler, oynatıcı çubuğu ve elle işaretlenmiş cevaplar var.
- Bazı sorular klasörler arasında veya aynı klasörde tekrar ediyor.
- OCR, küçük kod metinlerinde ve Türkçe karakterlerde hata yapabildiği için konu tespiti görsel incelemeyle desteklenmiştir.
- Görsellerdeki işaretli seçenekler güvenilir cevap anahtarı kabul edilmemiştir.
- Kaynak ifadeleri yalnızca konu ve seviye belirlemek için kullanılmış; sorular ve seçenekler özgün Ship It Ops senaryoları olarak yazılmıştır.

## Soru seti kapsam planı

45 soru için etiket dağılımı:

- Sorting: 8
- Complexity: 6
- Searching: 4
- Hashing: 4
- Shortest Path: 4
- MST: 4
- Big-O: 3
- Recursion: 3
- Divide and Conquer: 3
- BFS: 2
- Greedy: 2
- DFS: 1
- Correctness: 1

Bu dağılım kaynakta sık tekrarlanan karmaşıklık, sıralama ve çizge algoritmalarını öne çıkarırken tek bir konunun seti aşırı biçimde kaplamasını önler.

## Zorluk ve rank planı

- `difficulty_star: 1`: 15 soru; doğrudan algoritma seçimi, temel karmaşıklık ve basit arama/sıralama kararları
- `difficulty_star: 2`: 15 soru; uygulama ayrıntıları, performans durumları, temsil tercihleri ve standart doğruluk koşulları
- `difficulty_star: 3`: 15 soru; yineleme analizi, ileri kenar durumları, algoritma önkoşulları ve doğruluk/optimizasyon kararları
- Rank dağılımı: rank 1 için 15, rank 2 için 15, rank 3 için 15
