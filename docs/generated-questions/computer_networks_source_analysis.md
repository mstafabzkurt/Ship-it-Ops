# Bilgisayar Ağları - Kaynak analizi

## Arşivde bulunan dosyalar

`bilgisayaraglari.zip` içinde beş PDF bulundu:

- `Bilgisayar Ağları Ara Sınav.pdf` - 3 sayfa
- `Bilgisayar Ağları.pdf` - 6 sayfa
- `bil_401_yilsonu_sinavi_calisma_sorulari.pdf` - 4 sayfa
- `bil401_yil_sonu_sinavi_calisma_sorulari.pdf` - 4 sayfa
- `FİNAL.pdf` - 7 sayfa

İki yıl sonu çalışma sorusu dosyasının adları ve PDF üretimleri farklı olsa da içerikleri büyük ölçüde aynı soru setini temsil ediyor. Bu tekrar konu ağırlığını yapay biçimde artırmak için kullanılmadı. Arşivdeki soru ve çözüm metinleri yalnızca konu, seviye ve yaygın hata türlerini anlamak için incelendi; soru cümleleri ve seçenekler aktarılmadı.

## Tespit edilen konular

- uygulama, taşıma, ağ ve veri bağı katmanlarındaki veri birimleri
- paket anahtarlama, devre anahtarlama ve sakla-ilet davranışı
- iletim, yayılım, işlem ve kuyruk gecikmesi
- darboğaz bağlantısı, throughput ve trafik yoğunluğu
- mesaj bölümleme ve bağlantılar arası ardışık aktarım
- socket, süreç adresleme ve portlar
- TCP ile UDP seçimleri
- DNS çözümleme akışı
- kalıcı ve kalıcı olmayan HTTP, paralel bağlantılar ve web önbellekleme
- güvenilir veri aktarımında checksum, ACK/NAK, zamanlayıcı ve sıra numarası
- stop-and-wait, Go-Back-N, Selective Repeat ve kayan pencere
- IP datagram parçalama, MTU, fragment offset ve yeniden birleştirme
- distance-vector ve link-state/Dijkstra yönlendirme
- ICMP, TTL, ping/traceroute mantığı ve paket yakalama yorumlama
- Wireshark üzerinden HTTP, TCP ve ICMP akışı teşhisi

## Kaynak kalitesi ve OCR sınırlamaları

- Dört PDF kullanılabilir metin katmanına sahip; bazı matematik sembolleri ve Türkçe karakterler bozuk kodlanmış durumda.
- `FİNAL.pdf` tamamen görüntü tabanlıdır. Yedi sayfa görsel olarak incelendi; sayfalarda perspektif, el yazısı, işaretleme ve düşük kontrast bulunuyor.
- Final PDF'sindeki bozuk sıkıştırma akışları render sırasında uyarı üretti, ancak sayfaların tamamı okunabilir görüntülere dönüştürülebildi.
- Bazı kaynaklar soru, bazıları çözüm niteliğinde ve önemli ölçüde içerik tekrarı var. Bu nedenle dağılım dosya sayısına değil, benzersiz konu çeşitliliğine göre kuruldu.

## Soru kapsamı planı

45 özgün soru şu alanlara dağıtıldı:

- temel katman, paket anahtarlama, gecikme, throughput, socket ve protokol seçimi
- DNS ve HTTP istek akışı, bağlantı kalıcılığı ve önbellekleme
- güvenilir veri aktarımı, checksum, ACK/NAK, zaman aşımı ve sıra numarası
- stop-and-wait, Go-Back-N, Selective Repeat ve pencere verimliliği
- IP parçalama ve fragment yeniden birleştirme
- distance-vector, Dijkstra ve yönlendirme döngüsü kararları
- ICMP/TTL ile erişim teşhisi ve Wireshark paket yorumlama

Etiketler kaynakta görülen kavramlara göre kısa ve kararlı tutuldu: `OSI`, `Switching`, `Latency`, `Congestion`, `TCP/IP`, `TCP`, `UDP`, `DNS`, `HTTP`, `Reliable Transfer`, `Packet Loss`, `IP`, `Routing`, `ICMP` ve `Debugging`.

## Zorluk dağılımı planı

- `difficulty_star: 1` - 15 soru: doğrudan katman, gecikme, throughput, TCP/UDP, DNS/HTTP ve temel güvenilirlik kararları.
- `difficulty_star: 2` - 15 soru: paketleme, kuyruk yükü, HTTP/DNS akışı, kayan pencere davranışı, portlar, IP parçalama ve standart yönlendirme kararları.
- `difficulty_star: 3` - 15 soru: bant genişliği-gecikme çarpımı, sıra numarası belirsizliği, kayıp/bozuk ACK, fragment kenar durumları, yönlendirme döngüsü ve çok katmanlı paket teşhisi.

## Bilerek dışarıda bırakılan konular

ARP, DHCP, NAT, firewall, kablosuz ağlar, HTTPS/TLS, Ethernet anahtarlama tabloları, VLAN/STP ve ayrıntılı subnetting kaynaklarda belirgin biçimde desteklenmediği için soru setine eklenmedi.
