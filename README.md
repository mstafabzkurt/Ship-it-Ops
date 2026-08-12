<div align="center">

# 🚨 Ship-it-Ops

**React Native + Expo + Supabase tabanlı mühendislik kriz yönetimi simülasyonu**

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

</div>

> “Production'da çalışıyor” bir başarı ölçütü değil, olay örgüsünün başlangıcıdır.

## 🎮 Bu proje ne yapıyor?

**Ship-it-Ops**, yazılım mühendislerinin günlük hayatında karşılaşabileceği teknik krizleri karar tabanlı bir simülasyona dönüştürür. Bir yanda çöken servisler, diğer yanda eriyen şirket bütçesi...

Oyuncu; **N+1 sorguları**, **frontend kilitlenmeleri**, **race condition**, hatalı deployment, cache problemleri, veri tabanı krizleri ve güvenlik vakaları gibi senaryolarda dört farklı müdahale arasından seçim yapar. Her kararın itibara ve bütçeye gerçek bir etkisi vardır.

```text
Kriz gelir → Seçenekler karıştırılır → Karar verilir
           → İtibar/Bütçe güncellenir → Öğretici geri bildirim gösterilir
```

## ✨ Öne çıkanlar

| Özellik | Ne işe yarıyor? |
|---|---|
| 🎲 Dört kademeli karar sistemi | Her soru `optimal`, `acceptable`, `wrong` ve `fatal` seçeneklerine sahip |
| 📈 İtibar sistemi | Doğru kararlar kariyer seviyesini yükseltir |
| 💰 Bütçe yönetimi | Teknik kararların ekonomik sonucu anında bakiyeye yansır |
| 🛒 Mağaza ve temalar | Kazanılan bütçe, odalar ve görsel özelleştirmeler için kullanılır |

## 🧱 Teknoloji yığını

| Katman | Teknoloji |
|---|---|---|
| Mobil uygulama | React Native |
| Geliştirme ortamı | Expo + Expo Router |
| Dil | TypeScript |
| Backend | Supabase |
| Veritabanı | PostgreSQL |
| Global state | Context API |
| Yerel kalıcılık | AsyncStorage |

## 🕹️ Oyun mekaniği

| Sonuç | İtibar | Bütçe | UI tepkisi |
|---|---:|---:|---|
| `optimal` | +15 | +2.000 | Yeşil başarı geri bildirimi |
| `acceptable` | +5 | +750 | Yeşil olumlu geri bildirim |
| `wrong` | -5 | -750 | Kırmızı feedback + optimal cevap |
| `fatal` | -15 | -2.000 | Kırmızı feedback + optimal cevap |

## 🧩 Supabase soru şeması

Quiz ekranının kullandığı alanlar:

| Alan | Zorunlu | Kullanım |
|---|:---:|---|
| `id` | ✅ | Görülen soruları takip eden benzersiz kimlik |
| `rank_level` | ✅ | Oyuncunun seviyesine uygun soruları filtreleme |
| `tag` | ✅ | Kriz kategorisi veya kısa bağlam |
| `title` | ✅ | Ekranda gösterilen ana ve tam soru metni |
| `optimal_text` | ✅ | En iyi çözüm |
| `acceptable_text` | ✅ | Kabul edilebilir çözüm |
| `wrong_text` | ✅ | Yanlış çözüm |
| `fatal_text` | ✅ | Kritik derecede kötü çözüm |

## 🚀 Nasıl çalıştırılır?

### Gereksinimler

- Node.js 18 veya üzeri
- npm
- Expo Go ya da Android/iOS emülatörü
- Bir Supabase projesi

### 1. Repoyu klonla

```bash
git clone <repo-url>
cd Ship-it-Ops
```

### 2. Bağımlılıkları yükle

```bash
npm install
```

### 3. Ortam değişkenlerini tanımla

Proje kökünde `.env` dosyası oluştur:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> `.env` dosyasını repoya gönderme. Production kriz simülasyonu yapıyoruz; gerçek bir güvenlik krizini davet etmiyoruz. 🔐

### 4. Expo'yu temiz önbellekle başlat

```bash
npx expo start -c
```

`-c`, Metro/Expo önbelleğini temizler.

| Hedef | Komut |
|---|---|
| Expo geliştirme sunucusu | `npm start` |
| Android | `npm run android` |
| iOS | `npm run ios` |
| Web | `npm run web` |
| Temiz önbellek | `npx expo start -c` |

## 📁 Proje yapısı

```text
Ship-it-Ops/
├── app/
│   ├── _layout.tsx
│   └── (tabs)/
│       ├── game.tsx          # Quiz akışı, timer, feedback ve Supabase sorgusu
│       ├── index.tsx         # Dashboard
│       ├── profile.tsx       # Profil, istatistikler ve debug bütçe kontrolü
│       ├── reputation.tsx    # Kariyer ve itibar görünümü
│       ├── room-store.tsx    # Oda yükseltmeleri
│       └── store.tsx         # Mağaza
├── src/
│   ├── config/
│   │   └── gameRewards.ts    # Merkezi dört kademeli ödül/ceza ayarları
│   ├── state/
│   │   ├── ReputationContext.tsx
│   │   ├── RoomContext.tsx
│   │   └── ThemeContext.tsx
│   ├── theme/                # Renk, tipografi ve tema sistemi
│   └── supabase.ts           # Supabase istemcisi
└── package.json
```

## 🧪 Geliştirici modu

Profil ekranındaki **Add 10,000 Budget** butonu, mağaza ve tema geliştirmelerini test etmek için bütçeye anında 10.000 ekler.

## 🗺️ Yol haritası

- [x] Supabase tabanlı soru havuzu
- [x] Dört kademeli ve karıştırılmış cevap sistemi
- [x] Merkezi ödül/ceza konfigürasyonu
- [x] Öğretici yanlış cevap feedback'i
- [x] İtibar, bütçe, mağaza ve oda sistemi
- [x] Tema özelleştirmeleri
- [ ] Daha fazla rank seviyesi ve kriz paketi
- [ ] Ses efektleri ve haptik feedback
- [ ] Günlük görevler ve global skor tablosu



---

<div align="center">

**Ship it. Break it. Fix it. Learn from it.** 🚀

Production sakin görünüyorsa dashboard'u yenilememiş olabilirsin.

</div>
