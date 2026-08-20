# Hata kodları

`--json` gövdesindeki `error.code` değerleri. Çıkış kodu ayrı bir eksendir (0/1/2/3);
ikisini birlikte okuyun.

## Kimlik / yetki (çıkış 3)

| Kod | Anlamı | Ne yapmalı |
| --- | ------ | ---------- |
| `NOT_LOGGED_IN` | Yerel oturum yok | Kullanıcıdan `estorepark login` çalıştırmasını isteyin — tarayıcı onayını ajan yapamaz |
| `UNAUTHENTICATED` | Token geçersiz ∨ süresi dolmuş | Aynı: yeniden login |
| `FORBIDDEN` | Yetki ∨ token kapsamı yetersiz | Kullanıcının o mağazadaki staff izinleri yetmiyor. CLI token'ı yalnız tema scope'ları taşır: ürün/sipariş/müşteri/ayar yüzeylerine erişemez — başka komut deneyerek aşılamaz |
| `CODE_EXPIRED` | Device flow kodu süresinde onaylanmadı | `estorepark login` tekrar |

## Kullanım hatası (çıkış 2)

| Kod | Anlamı | Ne yapmalı |
| --- | ------ | ---------- |
| `MISSING_ARGUMENT` | Zorunlu argüman yok (CI'da liste açılamaz) | Argümanı açıkça verin (`--version`, `<slug>` …) |
| `INVALID_ARGUMENT` | Argüman biçimi yanlış (ör. sürüm pozitif tam sayı değil) | Değeri düzeltin |
| `UNKNOWN_FLAG` | Bilinmeyen bayrak — yazım hatası sessizce yutulmaz | Bayrağı `commands.md`'deki listeyle karşılaştırın |
| `NO_STORE_SELECTED` | Aktif mağaza yok | `estorepark store use <slug>` ∨ `--store <slug>` |
| `CONFIRMATION_REQUIRED` | `publish`/`rollback` onaysız çağrıldı | Kullanıcı açıkça isterse `--yes`; kendiliğinden eklemeyin |

## Durum / veri (çıkış 1)

| Kod | Anlamı | Ne yapmalı |
| --- | ------ | ---------- |
| `NO_STORES` | Hesabın erişebildiği mağaza yok | Kullanıcıya bildirin; CLI tarafında çözüm yok |
| `VERSION_NOT_FOUND` | İstenen sürüm yayın geçmişinde yok | `theme versions` ile listeleyin |
| `VERSION_SCAN_TRUNCATED` | Sürüm tarama sınırına takıldı, hedef bulunamadı | `--limit`/`--offset` ile daha derine bakın |
| `DEV_MODE_UNAVAILABLE` | Mağaza V2 render motorunda değil ∨ platformda önizleme origin'i tanımlı değil | Ortam koşulu — bayrak denemeyin, kullanıcıya bildirin |
| `ABORTED` | Onay kutusunda "hayır" | Hiçbir değişiklik yapılmadı; tekrar denemeyin |

## Ağ / sunucu (çıkış 1)

| Kod | Anlamı | Ne yapmalı |
| --- | ------ | ---------- |
| `RATE_LIMITED` | 429 — çok fazla istek | Bekleyin; döngüde tekrar denemeyin |
| `GRAPHQL_ERROR` | Sunucu iş kuralı reddi | Mesajı kullanıcıya iletin |
| `INTERNAL_SERVER_ERROR` | 5xx | Ortam sorunu; komutu değiştirerek çözmeye çalışmayın |
| `BAD_RESPONSE` / `EMPTY_RESPONSE` | Yanıt okunamadı ∨ boş | Genelde yanlış `--api`/`--accounts` kökü ya da erişilemeyen ortam |
