# Arkadaş 1v1 kapışma

## Oynanış

- Oyun Merkezi → **1v1 Kapışma**, arkadaş listesindeki **1v1 Kapış** veya kabul edilmiş arkadaş profilindeki aynı eylem üzerinden açılır.
- Davet, seçilen arkadaşa özeldir. `/duel/<matchId>` bağlantısı paylaşılabilir; bağlantıyı bilmek katılım yetkisi vermez. Davetler 10 dakika geçerlidir.
- Rakip kabul ettiğinde iki oyuncu için 5 saniyelik geri sayım başlar. Daveti gönderen oyuncu hazır beklemelidir; kabul öncesi iki ayrı hazır onayı yoktur.
- 7 ortak soru, her soruya en fazla 20 saniye. Ayrı 70 soruluk havuzdan rastgele seçilir; her maçta seçilen metinler, seçenekler ve cevaplar dondurulur. Ana oyunun soruları kullanılmaz.
- Oyuncu seçeneği işaretleyip **Yanıtı Kilitle** ile gönderir. İlk kaydedilen cevap değiştirilemez. Aynı isteğin tekrarı kayıt veya süreyi değiştirmez.
- Doğru yanıt 70 puan + hız bonusu `floor((20000 - response_ms) / 1000)` (0–20) + ilk doğru yanıt bonusu 10 puan kazandırır. Yanlış ve yanıtsız cevap 0 puandır. Soru başına en fazla 100, maç başına 700 puan; eşit toplam puanda beraberlik olur. Sunucunun cevabı aldığı an kullanıldığı için ağ gecikmesi süreye dahildir. İki doğru yanıtın sunucu zamanları tam eşitse ikisi de ilk doğru bonusunu alır.
- İki yanıt kilitlendiğinde veya 20 saniye dolduğunda doğruluk, seçenekler ve puan dökümü birlikte açılır. Rakip daha önce yanıtladıysa yalnızca onay işareti gösterilir. Sonuçtan 3 saniye sonra sonraki soru başlar; son sorudan sonra maç sonucu açılır. Soru sırasında toplam skor yalnızca önceki çözülmüş soruların puanını içerir.
- Soru sonucunda Sen/Rakip alanları doğru/yanlış simgelerini, puanı ve bonusları ayrı gösterir; başlık o soruda daha çok puan alanı belirtir. Büyük rakamlı geri sayım sonuçla birlikte görünür. Yeni soru ve sonuç aşamasında ekran yukarı kaydırılır. Bu akış için aşağıdaki üçüncü migration uygulanmalı ve yeni bir maç açılmalıdır; migration öncesinde başlamış maçlar eski kurallarıyla biter.
- Ekrandan çıkmak, uygulamayı arka plana almak veya bağlantıyı kesmek saati durdurmaz. Yeniden açınca sunucu durumuyla eşitlenir. **Maçtan Çekil** onaylandığında rakip hükmen kazanır.
- Sonuç ekranında soru incelemesi, iki kişi arasındaki galibiyet/mağlubiyet/beraberlik toplamı ve rövanş bulunur.
- Coin, şirket bütçesi, Kariyer XP, İtibar, Uptime, kategori ilerlemesi, başarı veya genel sıralama ödülü verilmez. İptal, ret ve süresi dolan davetler ikili istatistiğe eklenmez.

## Veritabanına uygulama

Mevcut arkadaşlık ve engelleme migration'ları uygulanmış olmalıdır. Yeni dosyaları Supabase SQL Editor'da sırayla çalıştırın:

1. `supabase/migrations/20261002120000_create_friend_duels.sql`
2. `supabase/migrations/20261002121000_seed_friend_duel_questions.sql`
3. `supabase/migrations/20261003120000_friend_duel_round_feedback.sql`

İlk migration bir kez uygulanır. Seed tekrar çalıştırılabilir; aktif maçların dondurulmuş soruları etkilenmez. Bu geliştirmede migration'lar yerel PostgreSQL üzerinde doğrulanmıştır; uzak Supabase projesine uygulanmamıştır.

Uygulama sürümünü yayımlamadan önce üç migration'ı uygulayın. Puan migration'ı eski aktif ve tamamlanmış maçları `scoring_version=1` olarak korur; bekleyen davetler ve yeni maçlar sürüm 2 kullanır. İki test hesabını arkadaş yapıp davet → kabul → yanıt → soru sonucu → sonraki soru → maç sonucu → rövanş akışını hedef Supabase projesinde doğrulayın. Bu kontrol gerçek ağ koşullarını ve projenin mevcut migration durumunu da kapsar.

## Güven sınırı ve saklama

`duel_questions`, `friend_duels`, `friend_duel_rounds`, `friend_duel_answers` tablolarında RLS açıktır; `anon` ve `authenticated` rolleri doğrudan okuyamaz/yazamaz. İstemci yalnızca kimliği `auth.uid()` üzerinden belirlenen RPC'leri kullanır. `private.duel_*` yardımcılarına istemci çalıştırma izni verilmez.

Sunucu arkadaşlık, her iki yönde engel, katılımcı kimliği, davet rolü, soru süresi ve tek cevap koşullarını kontrol eder. Çözülmemiş soruda yalnızca soru, oyuncunun kendi cevabı ve rakibin cevaplayıp cevaplamadığı döner. Doğru cevaplar ve rakibin seçenekleri yalnızca çözülmüş sorularda açılır; hükmen bitişte gelecek soruların anahtarları açılmaz. Sonuç/H2H istatistikleri sunucuda hesaplanır; istemci puan veya kazanılan maç sayısı gönderemez.

Aynı iki kişi arasında bir açık davet/maç, oyuncu başına bir aktif maç bulunabilir. Davet oluşturma sınırları: saatte 12, günde 40, aynı anda 5 gönderilmiş ve 20 alınmış bekleyen davet. Aynı çift için yinelenen davet isteği mevcut açık kaydı döndürür. Kullanıcı ve maç kilitleri paralel mutasyonları sıralar.

Tamamlanan maçlar bir sonraki durum/list/H2H okumasında kesinleştirilir; cron gerektirmez. İkili istatistik bitmiş maçlardan toplandığı için tekrar okuma veya istek tekrarı sayacı artırmaz. Liste en fazla 60 maçı getirir; arayüz en yeni 20 geçmiş kaydı gösterir. H2H tüm tamamlanan maçları sayar. Engellenen oyuncuyla yeni etkileşim ve maç geçmişini okuma kapatılır.

Soru havuzu sınırlıdır; farklı maçlarda soru tekrarı mümkündür. Havuz ayrı tutulması ve ödül verilmemesi ekonomik istismarı önler, dışarıdan cevap araştırmayı bütünüyle engellemez. Ek soru hazırlama ilkeleri `docs/duel-question-bank.md` içindedir.

## Kontroller

4 Ekim 2026 güncellemesi: 116 yerel PostgreSQL kontrolü (eski maç uyumluluğu, erken çözüm, bonuslar, tam eşitlik, yanıtsız süre sonu, tekrar gönderim, hükmen sonuç ve yetki sınırları) ve model gizlilik testleri geçti. Yeni tarayıcı testi rakip cevapladı göstergesini, soru sonucunu, 3 saniyelik geçişi ve sohbet davet/tema entegrasyonunu da kapsar. TypeScript ve web export başarılı; gerçek iki hesaplı Supabase/native kontrolü yapılmadı.

```sh
npm run test:duels
npm run test:friends
npm run test:public-profiles
npm run test:messaging
npx tsc --noEmit
npx expo export --platform web
```

`test:duels`, modelin özel alanları filtrelemesini ve gerçek migration/RPC'leri bellek içi PostgreSQL (PGlite) üzerinde çalıştırır. Üretim hesabı, ağ veya gizli anahtar kullanmaz. Zaman sınırı testleri yalnızca bu geçici test veritabanındaki başlangıç zamanını değiştirir. PGlite testi tek bağlantılıdır; üretimdeki bağlantılar arası kilit yarışı/yük testi yerine geçmez.

Tarayıcı smoke testi `npm run test:duels:web` ile dışa aktarılmış web sürümünde çalışır. Playwright yerel modül olarak kurulu değilse `PLAYWRIGHT_MODULE` ortam değişkenini mevcut kurulumun tam yoluna ayarlayın. `PLAYWRIGHT_CHANNEL=chrome` mevcut Chrome kurulumunu kullanır; test bağımlılık veya tarayıcı indirmez. Gerçek servise istek göndermeyen örnek cevaplarla arayüz akışını kontrol eder; tüm dış HTTP/WebSocket istekleri engellenir. SQL davranışı ayrı PGlite testiyle doğrulanır.

Doğrulama sonucu: 85 PostgreSQL kontrolü ve model gizlilik testleri geçti. Arkadaşlık, herkese açık profil ve mesajlaşma regresyon testleri, TypeScript ve web export geçti. Chrome üzerinde 360, 390, 430 ve 1280 px genişliklerde, default/daylight temalarında davet, kabul, geri sayım, yanıt kilitleme, sonuç, H2H ve rövanş akışları doğrulandı. Yatay taşma veya yakalanmamış JavaScript hatası bulunmadı. Mobil bölüm çakışması giderildi ve tarayıcı testine bu durumu yakalayan kontrol eklendi. Gerçek iki cihaz/Supabase hesabı ve native uygulama testi henüz yapılmadı.

Görsel kayıtlar: `docs/duel-qa/hub-360-dark.png`, `pending-390-dark.png`, `active-430-dark.png`, `result-1280-dark.png`, `result-390-light.png`.

## Web görünümü ve hareket

Ana ekran masaüstünde meydan okuma ve maç etkinliği olarak iki sütuna ayrılır. Arkadaşlar kendi avatar/çerçeveleriyle seçilir; tek arkadaş otomatik seçilir. Davetler, devam eden maçlar ve geçmiş ayrı görünüm düğmeleriyle açılır; yalnızca seçilen görünümün boş durumu gösterilir. Ayrıntılı kurallar, klavye odağını koruyan ve Escape ile kapanan “Nasıl oynanır?” penceresindedir.

Bekleme lobisinde iki oyuncu VS çevresinde, varsa ikili maç geçmişiyle gösterilir. Davet geçerliliği sunucu saatine göre dakika/saniye olarak güncellenir. Bağlantı kopyalanınca buton 2,4 saniye “Kopyalandı” durumuna geçer; iptal ve ret ikincil eylemlerdir.

Giriş, seçim, buton basma ve geri sayım hareketleri 150–240 ms sürer. Sürekli dekoratif animasyon yoktur. Hareketi azaltma tercihi başlangıçta ve sonradan değiştiğinde uygulanır; animasyonlar maç saatini veya cevap işlemini kontrol etmez.

Polish doğrulaması: TypeScript ve web export geçti. Tarayıcı smoke testi 360/390/430/1280 px, default/daylight temaları ve iki hareket tercihinde başarılıdır. Tek arkadaş seçimi, etkinlik görünümü değiştirme, mobil bölüm sırası, masaüstü sütunları, kural penceresi ve odak dönüşü, gerçek yerel panoya kopyalama, davet/kabul/yanıt/sonuç/rövanş doğrulandı. Dış ağ istekleri engellendi; sunucu yanıtları bu UI testinde örnektir. Ek görseller: `docs/duel-qa/hub-1280-light.png`, `lobby-1280-light.png`, `rules-360-dark.png`, `empty-390-light.png`.
