# Bilgisayar Ağları 60 soru kalite notları

## Son durum

- Toplam soru: 60
- `difficulty_star` dağılımı: 1 yıldız 20, 2 yıldız 20, 3 yıldız 20
- `rank_level` dağılımı: seviye 1 için 17, seviye 2 için 25, seviye 3 için 18
- Kategori: Tüm kayıtlarda `computer_networks`
- Gözden geçirilmiş ilk 45 soru içerik ve sıra bakımından değişmeden korundu.

## Konu ve etiket dağılımı

| Etiket | Adet |
| --- | ---: |
| OSI | 1 |
| Switching | 3 |
| Latency | 7 |
| Congestion | 3 |
| TCP/IP | 3 |
| TCP | 1 |
| UDP | 1 |
| DNS | 3 |
| HTTP | 6 |
| Reliable Transfer | 13 |
| Packet Loss | 2 |
| IP | 5 |
| Routing | 6 |
| ICMP | 2 |
| Debugging | 4 |

## Eklenen konu ve karar açıları

- Düzensiz ve kısa süreli trafik için paket anahtarlama ile devre anahtarlama kapasite kullanımı
- Yüksek throughput ile düşük ilk yanıt gecikmesinin farklı ölçüler olması
- Eşzamanlı TCP bağlantılarını kaynak/hedef IP ve port dörtlüsüyle ayırma
- Yoğun saatlerde değişen kuyruk gecikmesini diğer gecikme bileşenlerinden ayırma
- NAK sonrasında protokol kuralına uygun yeniden iletim
- Süresi dolan web önbelleği nesnesini koşullu HTTP isteğiyle doğrulama
- DNS önbellek süresi dolduğunda HTTP/TCP öncesi çözümleme sırası
- Wireshark izinde aynı TCP sıra aralığının yeniden iletim olarak yorumlanması
- Kararlı RTT ile düşük throughput birlikte görüldüğünde darboğaz kapasitesini araştırma
- Stop-and-wait durum makinesinde checksum hatalı paketin teslim edilmemesi
- Seyrek kayıplı, yüksek RTT'li hatta Go-Back-N yerine Selective Repeat değerlendirmesi
- DF biti ve yol MTU'su uyuşmazlığında ICMP Fragmentation Needed teşhisi
- Dijkstra gevşetmesinde yalnızca daha düşük maliyetle güncelleme
- `Cache-Control: no-cache` değerinin saklamayı değil yeniden kullanım öncesi doğrulamayı gerektirmesi
- Yinelenen TCP ACK'lerinden hızlı yeniden iletim çıkarımı

## Bilerek dışarıda bırakılan konular

Kaynak kapsamı gereği ARP, DHCP, NAT, firewall/güvenlik duvarı, wireless/kablosuz, HTTPS ve VLAN eklenmedi. Yeni sorular ağ güvenliği veya kablosuz ağ tasarımına kaydırılmadı.

## Doğrulama sonuçları

- JSON ayrıştırması başarılı ve toplam 60 kayıt doğrulandı.
- Zorluk dağılımı 20/20/20 olarak doğrulandı.
- Tüm `category_id`, `difficulty_star` ve `rank_level` değerleri geçerli.
- Gerekli alanların tamamı mevcut; boş metin bulunmuyor.
- Birebir yinelenen veya yakın eşleşen başlık bulunmadı.
- Aynı soru içinde yinelenen cevap metni bulunmadı.
- İlk 45 soru kaynak reviewed JSON ile birebir aynı.
- Kapsam dışında bırakılan konu ifadeleri bulunmadı.
- Doğru seçeneğin tek başına en uzun olduğu soru sayısı 32/60; seçenek uzunluğu bütün sorularda ortak bir cevap işareti oluşturmuyor.

## Kalan hususlar

- `Reliable Transfer` 13 soruyla en yoğun etikettir. Stop-and-wait, Go-Back-N, Selective Repeat, ACK/NAK, checksum, pencere ve sıra numarası kaynaklarda güçlü biçimde temsil edildiği için bu ağırlık korundu.
- TCP ve UDP doğrudan seçim soruları az sayıdadır; taşıma davranışlarının devamı TCP/IP, Reliable Transfer ve Debugging etiketli senaryolarda ölçülüyor.
- DF/MTU ve `Cache-Control: no-cache` maddeleri ileri seviye ayrıntılardır ancak kaynakta IP parçalama, ICMP ve HTTP önbellekleme açıkça bulunduğundan kapsam içinde tutuldu.
