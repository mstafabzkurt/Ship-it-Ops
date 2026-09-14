# Data Structures 60 soru seti kalite notları

## Sonuç

- Toplam soru: 60
- Kategori: `data_structures`
- Zorluk dağılımı: 1 yıldız 20, 2 yıldız 20, 3 yıldız 20
- Rank dağılımı: rank 1 için 22, rank 2 için 23, rank 3 için 15
- Kaynak reviewed setteki ilk 45 soru değiştirilmeden korundu.

## Eklenen kapsam

- Hashing: temel kullanım, zincirleme ile çakışma çözümü, yeniden boyutlandırma ve açık adreslemede silindi işareti
- Heap: öncelik kuyruğu seçimi, kök silme sonrası aşağı düzenleme ve doğrusal zamanda toplu yığın kurma
- Array: doğrudan indis erişimi ile ortadan ekleme maliyeti arasındaki tercih
- Sorting: kararlı sıralama ve belleğe sığmayan veri için dış sıralama
- Circular Linked List: tam tur dolaşmada doğru bitiş koşulu
- Graph: yoğun çizgede komşuluk matrisi seçimi ve yönsüz DFS döngü kontrolünde ebeveyn kenarı
- Tree: özyinelemesiz inorder dolaşmada yığın kullanımı

## Yeni soruların seviye yaklaşımı

- 1 yıldız sorular doğrudan veri yapısı seçimi ve temel kullanım kararlarına ayrıldı.
- 2 yıldız sorular çakışma çözümü, yeniden boyutlandırma, silme sonrası düzenleme ve temsil tercihlerine ayrıldı.
- 3 yıldız sorular açık adresleme silme ayrıntısı, O(n) heap kurma, DFS doğruluğu, özyinelemesiz dolaşma ve dış sıralamayı kapsıyor.

## Doğrulama

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
- İlk 45 sorunun kaynak JSON ile birebir eşitliği: başarılı
- Yeni başlıkların önceki 45 başlığa basit sözcük-kümesi benzerlik taraması: yüzde 50 ve üzeri eşleşme yok

## Kalan değerlendirme noktaları

- Yakın başlık kontrolü sezgisel bir metin benzerliği taramasıdır; anlamsal benzerliğin son kararı editoryal incelemeye bağlıdır.
- Yeni kapsam kaynak ZIP'teki konu düzeyini koruyarak genişletildi; sorular kaynak sınav metinlerinin kopyası değildir.
- Bu aşamada SQL dosyası üretilmedi.
