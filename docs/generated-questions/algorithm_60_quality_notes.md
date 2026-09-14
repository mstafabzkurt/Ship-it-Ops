# Algoritma 60 soru seti kalite notları

## Sonuç

- Toplam soru: 60
- Kategori: `algorithm`
- Zorluk dağılımı: 1 yıldız 20, 2 yıldız 20, 3 yıldız 20
- Rank dağılımı: rank 1 için 20, rank 2 için 21, rank 3 için 19
- Kaynak reviewed setteki ilk 45 soru birebir korunmuştur.

## Konu ve etiket dağılımı

- Sorting: 9
- Complexity: 7
- Shortest Path: 6
- Big-O: 5
- Hashing: 5
- MST: 5
- Searching: 4
- Recursion: 4
- Divide and Conquer: 4
- BFS: 3
- DFS: 3
- Greedy: 3
- Correctness: 2

Dynamic Programming ve Backtracking kaynak kapsamında olmadığı için eklenmemiştir.

## Yeni eklenen konu açıları

- Tek geçişli algoritmada zaman ile ek alan karmaşıklığını ayırma
- O(n log n) ve O(n²) çözümler arasında büyük girdi ölçeklenebilirliği
- Özyinelemede boş çarpım için doğru temel durum
- Yazma maliyeti yüksek ortamda seçmeli sıralama tercihi
- Kümelenmeyi azaltan özet işlevi özelliği
- DFS bitiş zamanlarıyla topolojik sıralama
- Komşuluk listesiyle BFS'nin O(V+E) dolaşma maliyeti
- Dijkstra öncelik kuyruğundaki eski uzaklık kayıtlarını eleme
- Küçük alt problemlerde böl ve yönet eşiği kullanma
- Asimptotik üst sınırdan çıkarılabilecek doğru sonuç
- Yönlü DFS'de etkin ve tamamlanmış düğüm ayrımı
- Bellman-Ford'da değişiklik olmayan tam turdan sonra erken bitirme
- Açgözlü para seçimine karşı örnekle doğruluk sınaması
- MST kesim özelliğiyle güvenli kenar seçimi
- Sıralama karşılaştırıcısında geçişlilik ve tutarlılık

## Doğrulama sonuçları

- JSON ayrıştırma: başarılı
- Toplam soru sayısı: 60
- Zorluk dağılımı: 20 / 20 / 20
- Zorunlu alanlar: eksiksiz
- Boş metin alanı: yok
- `category_id` tutarlılığı: başarılı
- `difficulty_star` değer aralığı: başarılı
- `rank_level` değer aralığı: başarılı
- Yinelenen başlık: yok
- Aynı soruda yinelenen cevap metni: yok
- İlk 45 sorunun kaynak reviewed JSON ile birebir eşitliği: başarılı
- Yeni başlıkların önceki 45 başlığa basit sözcük-kümesi benzerlik taraması: yüzde 50 ve üzeri eşleşme yok
- Doğru cevap uzunluğu tekdüze değil; `optimal_text` 60 sorunun 34'ünde en uzun seçenek

## Kalan değerlendirme noktaları

- Sorting, Complexity ve Shortest Path kaynakta geniş yer tuttuğu için sette en yüksek paya sahip etiketlerdir.
- Başlık yakınlığı kontrolü sözcük kümelerine dayalı sezgisel bir taramadır; anlamsal tekrar için editoryal okuma yararlı olabilir.
- Şema gereği `acceptable_text` alanı da yanlış distractor olarak kullanılmaktadır.
- Bu aşamada SQL dosyası üretilmemiştir.
