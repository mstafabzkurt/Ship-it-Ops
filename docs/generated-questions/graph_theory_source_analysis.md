# Çizge Kuramı - kaynak analizi

## Arşivde bulunan dosyalar

`cizgekurami.zip` içinde sekiz dosya bulundu:

- `bil244_graph_arasinav_bahar_2023-1.pdf` - 3 sayfa
- `bil244_graph_butunleme_sinavi_bahar_2023.pdf` - 4 sayfa
- `IMG-20240608-WA0024.jpg`
- `IMG-20240608-WA0026.jpg`
- `IMG-20240608-WA0027.jpg`
- `IMG-20240608-WA0028.jpg`
- `IMG-20240608-WA0029.jpg`
- `IMG-20240608-WA0030.jpg`

İki PDF'nin yedi sayfası ile altı JPG dosyasının tamamı incelendi. Kaynaklar yalnızca ders kapsamı, seviye ve yaygın kavramları belirlemek için kullanıldı; soru cümleleri, şekiller ve sayısal örnekler doğrudan aktarılmadı.

## Tespit edilen konular

- düğüm, ayrıt, yön ve ayrıt ağırlığıyla çizge modelleme
- yönlü, yönsüz ve ağırlıklı çizgeler
- komşuluk matrisi ve komşuluk listesi
- seyrek/yoğun çizgelerde gösterim maliyeti
- yol, erişilebilirlik ve çevrim kavramları
- bağlı bileşenler ve gezinme ormanı
- BFS ve DFS tarafından üretilen ağaçların yapısal yorumu
- komşu sırasının traversal ağacına etkisi
- labirentin çizge olarak modellenmesi
- ağaçların bağlılık ve çevrimsizlik özellikleri
- kapsayan ağaç ve minimum kapsayan ağaç
- Prim/Kruskal sonuçlarının yapısal doğruluk koşulları
- ağırlıklı en kısa yol ve relaxation ilişkisi
- Dijkstra'nın ağırlık koşulları
- Bellman-Ford, negatif ayrıt ve erişilebilir negatif çevrim
- kur dönüşümü/arbitraj probleminin çevrim olarak modellenmesi
- tek kullanımlık yol ayrıcalığı için genişletilmiş durum çizgesi

Kaynakta ikili arama ağacı ve inorder/preorder/postorder soruları da bulunuyor. Bunlar Data Structures kategorisiyle daha doğrudan örtüştüğü için bu sette yalnızca genel ağaç ve traversal ilişkisini destekleyen bağlam olarak kullanıldı.

## Kaynak kalitesi ve OCR/görüntü sınırlamaları

- PDF'ler dijital olarak hazırlanmış ve şekiller okunaklıdır; bazı sembol ve formüller görsel inceleme gerektirdi.
- JPG dosyalarının çoğu ders slaydı veya sınav sorusu ekran görüntüsüdür. Bir kısmı PDF içindeki BFS/DFS sorularını tekrar eder.
- `IMG-20240608-WA0026.jpg` düşük çözünürlüklüdür; komşuluk listesi/matrisi karşılaştırmasını doğrulamak için kullanılabildi, küçük metin ayrıntıları kaynak kapsamına alınmadı.
- Bazı kaynak soruları algoritma kodu tamamlama biçimindedir. Yeni set bu kodu veya sınav dilini tekrar etmez.

## Konu kapsamı planı

45 özgün soru şu alanlara dağıtıldı:

- temel düğüm/ayrıt, yön, ağırlık, yol, çevrim ve bağlılık kararları
- komşuluk matrisi/listesi seçimi ve yönlü-yönsüz tutarlılık kontrolleri
- BFS/DFS sonuçlarının katman, ata ve kapsanan bileşen açısından yapısal yorumu
- ağaç, orman, kapsayan ağaç ve minimum kapsayan ağaç özellikleri
- en kısa yol etiketlerinin doğruluğu, negatif ayrıt ve negatif çevrim etkisi
- kur çevrimi ve tek kullanımlık indirim gibi problemlerin çizge durumuna dönüştürülmesi

Algoritma kategorisiyle karışmaması için uygulama kodu, kuyruk/yığın kodlaması ve ayrıntılı çalışma zamanı optimizasyonu yerine çizge modeli, önkoşul ve sonuç doğruluğu vurgulandı.

## Zorluk dağılımı planı

- `difficulty_star: 1` - 15 soru: temel modelleme, yön, komşuluk, yol/çevrim, bağlılık ve ağaç kavramları.
- `difficulty_star: 2` - 15 soru: gösterim seçimi, traversal ağacı yorumu, ağaç değişmezleri, kapsayan ağaç ve en kısa yol etiketleri.
- `difficulty_star: 3` - 15 soru: negatif çevrim, genişletilmiş durum çizgesi, MST cut/cycle özellikleri, traversal yapısına dayalı çıkarım ve temsil hataları.

## Bilerek dışarıda bırakılan konular

Kaynaklarda belirgin biçimde görülmediği için Euler yolu/devresi, Hamilton yolu/devresi, düzlemsel çizgeler, çizge renklendirme, eşleme, izomorfizm, iki parçalı çizgeler ve akış ağları eklenmedi. Matris çarpımına ilişkin genel karmaşıklık slaydı tek başına çizge konusu sayılmadı.

## Algoritma ve Bilgisayar Ağları kategorileriyle örtüşme

- BFS, DFS, Dijkstra, Bellman-Ford, Prim ve Kruskal kaynaklarda açıkça bulunuyor. Sorular bunların kodlanmasına değil; ürettikleri ağaçların, etiketlerin, çevrimlerin ve kapsama koşullarının yapısal doğruluğuna odaklandı.
- Ağ bağlantısı örnekleri yalnızca soyut çizge modeli olarak kullanıldı. TCP/IP, yönlendirme protokolleri, paket akışı veya ağ performansı gibi Computer Networks konuları eklenmedi.
