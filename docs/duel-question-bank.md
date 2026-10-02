# Arkadaş düellosu soru havuzu

Arkadaşlar arasında 1v1 düello için yazılmış **70 özgün Türkçe soru** bulunur. Bu havuz `public.duel_questions` tablosundadır; olay sorularının para, bütçe veya ödül değerlerini kullanmaz. Soru ve seçenekler doğrudan bu kullanım için yazılmıştır; mevcut olay bankasından alınmamıştır.

Kaynak: `supabase/migrations/20261002121000_seed_friend_duel_questions.sql`. Bu migration, tabloyu oluşturan arkadaş düellosu migration'ından sonra uygulanır. Aynı anahtar tekrar yüklenirse içerik güncellenir. Anahtarlar `duel-<kategori>-001` biçimindedir; her kategoride 001–010 aralığı kullanılır.

| Kategori anahtarı | Ekranda kullanılabilecek ad | Soru sayısı |
| --- | --- | ---: |
| `algorithms` | Algoritma ve veri yapıları | 10 |
| `databases` | Veritabanları | 10 |
| `networking` | Ağlar | 10 |
| `security` | Güvenlik | 10 |
| `programming` | Programlama | 10 |
| `testing` | Test | 10 |
| `operations` | Operasyon | 10 |

## İçerik ilkeleri

- Her soru dört farklı seçenek, sıfır tabanlı tek doğru cevap (`correct_index`) ve kısa bir açıklama içerir.
- Soru metinleri 20 saniyelik turda okunabilecek kadar kısadır. Uzun kod blokları, sürüme bağlı API ayrıntıları ve ters köşe sorular kullanılmaz.
- Temel bilgiler ile kısa hesaplama ve uygulama senaryoları birlikte bulunur. Sürelerin toplamı, önek toplamı ve indirim hesabı gibi sorularda varsayımlar metinde belirtilir.
- Güvenlik ve operasyon sorularında koşullar açıkça verilir: örneğin uyumlu önceki sürüm, oturum çerezi veya belirlenmiş hedef servisler. Açıklamalar yanlış seçeneklerin ima ettiği garantileri düzeltir.
- Doğru cevap konumları dağıtılmıştır: indeks 0 ve 1 için 18'er, indeks 2 ve 3 için 17'şer soru vardır. İstemci seçenekleri yeniden sıralıyorsa doğru cevabı da eşlemelidir.
- Yeni soru eklerken aynı kavramın bulunması tek başına kopya sayılmaz; aynı anlatım veya aynı senaryonun yeniden kullanımı ayrıca gözden geçirilmelidir. Teknik kavram ortaklığı kaçınılmazdır.

## Seed doğrulaması

Yerel doğrulamada migration içindeki JSON veri kümesi ayrıştırılarak 70 benzersiz anahtar, kategori başına 10 soru, dört farklı boş olmayan seçenek, 0–3 aralığında tam sayı cevap indeksi ve boş olmayan açıklama denetlenmiştir. Yeni havuz içinde normalize edilmiş aynı soru metni bulunmamıştır. `src/data/incidents.ts` ve `docs/generated-questions/*` içerikleriyle tam soru metni karşılaştırmasında eşleşme bulunmamıştır. Bu karşılaştırma anlamsal benzerlik veya uzaktan veritabanı içeriği için bir garanti değildir.

Migration uygulandıktan sonra sayım aşağıdaki sorguyla doğrulanabilir:

```sql
SELECT category, count(*) AS question_count
FROM public.duel_questions
WHERE active AND key LIKE 'duel-%'
GROUP BY category
ORDER BY category;
```

İçerik kontrolü için aşağıdaki sorgu sıfır satır dönmelidir:

```sql
SELECT key
FROM public.duel_questions
WHERE key LIKE 'duel-%'
  AND (
    jsonb_typeof(options) <> 'array'
    OR jsonb_array_length(options) <> 4
    OR correct_index NOT BETWEEN 0 AND 3
    OR btrim(prompt) = ''
    OR btrim(explanation) = ''
  );
```

Yerel kontrol seed yapısını ve metinleri doğrular. Migration bu çalışma sırasında uzak bir veritabanına uygulanmamıştır.
