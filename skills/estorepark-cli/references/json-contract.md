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

## `theme push` — uyarı alanı

`push` her çağrıda DRAFT'ı ezdiği için uyarır:

```json
{ "ok": true, "warnings": ["DRAFT_REPLACED"], "...": "…" }
```

`warnings` boş olsa bile alan bulunur; varlığını hata sanmayın — `ok: true` başarıdır.

## `theme dev` — uzun ömürlü komut

`theme dev --json`, proxy dinlemeye başladığı anda **tek bir "hazır" dokümanı** basar
(`proxyUrl`, `targetOrigin`, `sessionIdPrefix` gibi alanlarla), sonra çalışmaya devam eder.
Süreç bitmediği için stdout'a EOF gelmez.

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
