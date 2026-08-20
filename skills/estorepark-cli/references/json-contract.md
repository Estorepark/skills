# `--json` çıktı sözleşmesi

`--json` altında **stdout tek bir JSON dokümanı taşır.** İlerleme satırları, uyarılar ve
spinner stderr'e gider. Bu yüzden `estorepark theme list --json | jq` güvenlidir.

## Başarı

```json
{ "ok": true, "...": "komuta özgü gövde" }
```

## Hata

```json
{ "ok": false, "error": { "code": "NO_STORE_SELECTED", "message": "mağaza seçilmedi" } }
```

Ayrımı **`error.code`** ile yapın; `message` insan içindir ve değişebilir.
Kod listesi: [errors.md](errors.md).

## `warnings` alanı

Başarılı gövde (`ok: true`) uyarı taşıyabilir. Varlığını hata sanmayın.

`theme push` — **koşulsuz**, her çağrıda:

```json
{ "ok": true, "store": "magazam", "themeId": "…", "version": { "contentHash": "…" },
  "warnings": ["DRAFT_REPLACED"] }
```

Alan hiç boş dönmez; script "bu işlem DRAFT'ı tamamen değiştirdi" bilgisine her zaman
erişebilsin diye koşulsuzdur.

`theme package` — **koşullu**: `--out` çıktısı tema klasörünün içine düşerse
`warnings: ["OUTPUT_INSIDE_THEME"]` eklenir (üretilen zip bir sonraki pakete gömülür).
Varsayılan `.estorepark/theme.zip` bu tuzağa düşmez; uyarı yoksa alan da yoktur.

## `theme dev` — uzun ömürlü komut

`theme dev --json`, proxy dinlemeye başladığı anda **tek bir "hazır" dokümanı** basar, sonra
çalışmaya devam eder. Süreç bitmediği için stdout'a EOF gelmez.

```json
{ "ok": true, "ready": true, "proxyUrl": "http://localhost:9292", "targetOrigin": "https://…",
  "sessionIdPrefix": "a1b2c3d4…", "themeId": "…", "store": "magazam", "dir": "/…/tema",
  "fileCount": 42, "payloadBytes": 123456 }
```

Senkron/heartbeat satırları stderr'de kalır.

```bash
# YANLIŞ — jq EOF beklerken kilitlenir
estorepark theme dev --json | jq

# DOĞRU — dokümanı dosyadan okuyun
estorepark theme dev --json --no-input > dev.json &
# dev.json dolduğunda proxyUrl'i oradan alın
```

`sessionIdPrefix` kırpılmış bir değerdir; tam session id'si **gövdeye girmez** çünkü
`<mağaza-host>/?epid=…` ile temayı açan bir yetenek anahtarıdır. Kırpılmış hâlini bile
log/issue/chat'e yapıştırmayın.

## Yardım metni

`--json` ile yardım istenirse yardım stdout'a düz metin olarak **basılmaz** — tek-JSON
sözleşmesi kırılmasın diye. Yardımı okumak isteyen ajan `--json` vermemelidir.
