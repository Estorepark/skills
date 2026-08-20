# Hata kodları

`--json` gövdesindeki `error.code` değerleri, kaynaktaki `EXIT` eşlemesiyle birlikte.
Çıkış kodu ile hata kodu **ayrı eksenlerdir**; ikisini birlikte okuyun.

> Sezgiye aykırı olan: **"veri yok" durumları çıkış 2'dir** (`NO_STORES`, `NO_VERSIONS`,
> `VERSION_NOT_FOUND`) — CLI bunları "komutu böyle çağıramazsın" sayar, "çalıştı ama
> olumsuz" değil.

## Kimlik / yetki — çıkış 3

| Kod | Anlamı | Ne yapmalı |
| --- | ------ | ---------- |
| `NOT_LOGGED_IN` | Yerel oturum yok | Kullanıcıdan `estorepark login` isteyin — tarayıcı onayını ajan yapamaz |
| `UNAUTHENTICATED` / `UNAUTHORIZED` | Token geçersiz ∨ süresi dolmuş | Yeniden login |
| `FORBIDDEN` | Yetki yetersiz | Kullanıcının o mağazadaki staff izinleri yetmiyor |
| `INSUFFICIENT_SCOPE` | Token kapsamı yetersiz | CLI token'ı yalnız tema scope'ları taşır; ürün/sipariş/müşteri/ayar yüzeyi başka komutla da açılmaz |
| `ACCESS_DENIED` | Kullanıcı tarayıcıda onayı reddetti | Tekrar `login` |
| `LOGIN_FAILED` | Device flow sunucu tarafında başarısız | Ortam/erişim sorunu; tekrar deneyin |
| `CODE_EXPIRED` | Onay kodu süresinde girilmedi | Tekrar `login` |

## Kullanım hatası — çıkış 2

| Kod | Anlamı | Ne yapmalı |
| --- | ------ | ---------- |
| `MISSING_ARGUMENT` | Zorunlu argüman yok (CI'da liste açılamaz) | Argümanı açıkça verin |
| `INVALID_ARGUMENT` | Biçim yanlış (ör. `--version` pozitif tam sayı değil, bozuk `--limit`) | Değeri düzeltin — CLI sessizce varsayılana düşmez |
| `UNKNOWN_FLAG` / `UNKNOWN_COMMAND` | Yazım hatası sessizce yutulmaz | `commands.md`'deki listeyle karşılaştırın |
| `NO_STORE_SELECTED` | Aktif mağaza yok | `estorepark store use <slug>` ∨ `--store <slug>` |
| `STORE_NOT_FOUND` | Verilen slug erişilebilir mağazalarda yok | `estorepark store list` |
| `NO_STORES` | Hesabın erişebildiği mağaza yok | CLI tarafında çözüm yok, kullanıcıya bildirin |
| `NO_THEME` | Klasör bir temaya bağlı değil ∨ tema seçilemedi | `theme init` ∨ `--theme <id>` |
| `NO_VERSIONS` | Temanın yayın geçmişi yok | Geri alınacak sürüm yok; önce `publish` |
| `VERSION_NOT_FOUND` | İstenen sürüm geçmişte yok | `theme versions` ile listeleyin |
| `VERSION_SCAN_TRUNCATED` | Sürüm taraması sayfa tavanına takıldı, hedef bulunamadı | `--limit`/`--offset` ile daraltın |
| `CONFIRMATION_REQUIRED` | `publish`/`rollback` interaktif olmayan ortamda onaysız çağrıldı | Kullanıcı açıkça isterse `--yes`; kendiliğinden eklemeyin |
| `PORT_IN_USE` | `theme dev` portu meşgul | `--port <n>` |
| `ENOENT` | Dosya ∨ dizin yok | `--dir` yolunu kontrol edin |

## Komut çalıştı, sonuç olumsuz — çıkış 1

| Kod | Anlamı | Ne yapmalı |
| --- | ------ | ---------- |
| `ABORTED` | Onay kutusunda "hayır" | Hiçbir değişiklik yapılmadı; tekrar sormayın |
| `THEME_INVALID` | Yüklenecek bundle yapısal doğrulamayı geçmedi | `estorepark theme check` çıktısını düzeltin |
| `UPLOAD_FAILED` | Yükleme HTTP hatası | Ağ/ortam; tekrar deneyin |
| `PAYLOAD_TOO_LARGE` | Önizleme yükü sınırı aşıyor | Tema metin dosyalarını küçültün |
| `DEV_MODE_UNAVAILABLE` | Mağaza V2 render motorunda değil ∨ platformda önizleme origin'i tanımlı değil | Ortam koşulu — bayrak denemeyin |
| `UNSAFE_PATH` | Bundle içinde dizin dışına çıkan yol | Sembolik link / `..` içeren girdiyi kaldırın |
| `RATE_LIMITED` | 429 | Bekleyin; döngüde tekrar denemeyin |
| `GRAPHQL_ERROR` | Sunucu iş kuralı reddi | Mesajı kullanıcıya iletin |
| `INTERNAL_SERVER_ERROR` | 5xx | Ortam sorunu |
| `BAD_RESPONSE` / `EMPTY_RESPONSE` | Yanıt okunamadı ∨ boş | Genelde yanlış `--api`/`--accounts` kökü ∨ erişilemeyen ortam |
| `UNEXPECTED` | Sınıflandırılmamış hata | Mesajı olduğu gibi aktarın |

## Uyarı kodları (`ok: true`)

Bunlar hata değildir; başarılı gövdedeki `warnings` dizisinde döner.

| Kod | Ne zaman |
| --- | -------- |
| `DRAFT_REPLACED` | **Her `theme push`'ta** — DRAFT tamamen değiştirildi |
| `OUTPUT_INSIDE_THEME` | `theme package --out` çıktısı tema klasörünün İÇİNE yazıldığında — üretilen zip bir sonraki pakete gömülür |
