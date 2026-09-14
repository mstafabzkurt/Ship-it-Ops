# Bilgisayar Ağları soru seti kalite notları

## Son durum

- Toplam soru: 45
- `difficulty_star` dağılımı: 1 yıldız 15, 2 yıldız 15, 3 yıldız 15
- `rank_level` dağılımı: seviye 1 için 13, seviye 2 için 20, seviye 3 için 12
- Kategori: Tüm kayıtlarda `computer_networks`

## Konu ve etiket dağılımı

| Etiket | Adet |
| --- | ---: |
| OSI | 1 |
| Switching | 2 |
| Latency | 5 |
| Congestion | 2 |
| TCP/IP | 2 |
| TCP | 1 |
| UDP | 1 |
| DNS | 2 |
| HTTP | 4 |
| Reliable Transfer | 10 |
| Packet Loss | 2 |
| IP | 4 |
| Routing | 5 |
| ICMP | 2 |
| Debugging | 2 |

## Yapılan başlıca düzeltmeler

- Checksum, ACK ve temel yönlendirme kararı gibi protokol davranışı gerektiren sorular rank 2'ye taşındı; doğrudan port ayrımı rank 1'e alındı.
- İleri zorluktaki standart gecikme bileşeni ayrımı, hedefte IP yeniden birleştirme ve kalıcı HTTP kararı rank 2 olarak yeniden sınıflandırıldı. Go-Back-N, Selective Repeat, sıra numarası belirsizliği, distance-vector döngüsü, Dijkstra güncellemesi ve çok adımlı paket analizi rank 3'te tutuldu.
- DNS'i taşıma protokolü yapmak, ICMP ile dosya aktarmak veya HTTP methoduna göre rota seçmek gibi zayıf seçenekler; yanlış protokol varsayımı, yanlış yönlendirme anahtarı, teslimatı erken kabul etme ve paket akışını hatalı yorumlama gibi gerçekçi hatalarla değiştirildi.
- UDP teslim davranışı, checksum sınırı, ACK/NAK yorumu, DNS-TCP-HTTP bağımlılık sırası ve Wireshark akış yönü ifadeleri daha açık hale getirildi.
- Doğru seçeneğin tek başına en uzun olduğu soru sayısı 22/45 düzeyinde kaldı; uzunluk bütün sette sabit bir cevap ipucu oluşturmuyor.

## Bilerek dışarıda bırakılan konular

Kaynak analizinde açık destek bulunmadığı için ARP, DHCP, NAT, firewall/güvenlik duvarı, wireless/kablosuz, HTTPS ve VLAN konuları eklenmedi. İçerik siber güvenlik veya güvenlik duvarı kuralı setine dönüştürülmedi.

## Kalan hususlar

- `Reliable Transfer` etiketi 10 soruyla en yoğun etikettir. Bu ağırlık; kaynaklarda stop-and-wait, Go-Back-N, Selective Repeat, ACK/NAK, checksum, zamanlayıcı ve sıra numarası konularının tekrar tekrar işlenmesini yansıtıyor.
- İlk-pass kapsamı temel kavramlardan ileri protokol davranışlarına düzenli ilerliyor. Sonraki genişletmede aynı mekanizmaları tekrar etmek yerine socket, HTTP önbelleği, ICMP/TTL ve paket yakalama için farklı hata açıları tercih edilebilir.
- Kaynakların bir bölümü görüntü tabanlı ve işaretlenmiş olduğundan inceleme, önceki kaynak analiziyle belirlenen güvenilir konu sınırına bağlı kaldı.

## Doğrulama özeti

- JSON ayrıştırması başarılı ve tam 45 kayıt içeriyor.
- Zorluk dağılımı 15/15/15 olarak doğrulandı.
- Tüm kategori, zorluk ve rank değerleri geçerli.
- Gerekli alanların tamamı mevcut; boş metin bulunmuyor.
- Birebir veya yakın yinelenen başlık bulunmadı.
- Aynı soru içinde yinelenen cevap metni bulunmadı.
- Kapsam dışında bırakılan konulara ait ifade bulunmadı.
