# Algoritma soru seti kalite notları

## Sonuç

- Toplam soru: 45
- Kategori: `algorithm`
- Zorluk dağılımı: 1 yıldız 15, 2 yıldız 15, 3 yıldız 15
- Rank dağılımı: rank 1 için 15, rank 2 için 16, rank 3 için 14
- Soru eklenmedi veya çıkarılmadı.

## Konu ve etiket dağılımı

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

Dynamic Programming ve Backtracking kaynak analizinde belirgin olmadığı için sete eklenmedi.

## Yapılan ana düzeltmeler

- Üçüncü zorluk düzeyindeki üçgen döngü toplamı, doğrusal özyinelemeyi döngüye çevirme, seyrek anahtar aralığında sayma sıralaması ve güvenli ikili arama orta noktası soruları rank 2 olarak yeniden sınıflandırıldı.
- BFS'de kuyruğa eklerken ziyaret işareti koyma, Kruskal döngü denetimi ve döngü değişmeziyle doğruluk gösterimi rank 3 olarak yeniden sınıflandırıldı.
- Sıralanmamış veride önkoşulsuz ikili arama gibi seçenekler, yalnızca yavaş değil teknik olarak yanlış kararlar olacak biçimde netleştirildi.
- Fazla kolay elenen veya gerçekçi olmayan bazı tehlikeli seçenekler; yanlış karmaşıklık çıkarımı, erişilemeyen özyineleme tabanı, MST'de döngü seçimi ve bileşen denetimini atlama gibi gerçek uygulama hatalarıyla değiştirildi.
- Kaynaktaki sayılarla aynı olan bir yineleme sorusu özgün `T(n)=3T(n/4)+Θ(n²)` senaryosuyla değiştirildi; konu ve lisans düzeyi korundu.
- Başlıklar tasarım, hata ayıklama, ölçekleme ve üretim kararı biçiminde tutuldu; doğrudan sınav kalıbı kullanılmadı.
- Doğru seçenek uzunluğu tekdüze bırakılmadı. `optimal_text`, 45 sorunun 24'ünde en uzun seçenek; diğer 21 soruda daha kısa veya eşit uzunlukta.

## Doğrulama

- JSON ayrıştırma: başarılı
- Toplam soru sayısı: 45
- Zorluk dağılımı: 15 / 15 / 15
- Zorunlu alanlar: eksiksiz
- Boş metin alanı: yok
- `category_id` tutarlılığı: başarılı
- `difficulty_star` değer aralığı: başarılı
- `rank_level` değer aralığı: başarılı
- Yinelenen başlık: yok
- Aynı soruda yinelenen cevap metni: yok
- Basit sözcük-kümesi benzerliğiyle yüzde 55 ve üzeri yakın başlık eşleşmesi: yok

## Kalan değerlendirme noktaları

- Sorting ve Complexity kaynakta en sık görülen alanlar olduğu için set içinde bilinçli olarak daha yüksek paya sahip.
- Başlık benzerliği kontrolü sezgiseldir; anlamsal tekrar için son editoryal okuma yine yararlıdır.
- Şemadaki adına rağmen `acceptable_text` bu soru modelinde yanlış distractor olarak tutulmuştur.
