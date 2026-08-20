---
name: estorepark-cli
description: Drive the EstorePark CLI (`estorepark`) — device-flow login, store selection, and the theme command surface (init, dev, check, package, push, publish, versions, rollback, pull), including its single-document `--json` contract, exit codes and non-interactive/CI usage. EstorePark CLI ile mağaza teması geliştirme, yükleme, yayınlama ve geri alma; "estorepark login", "theme dev", "temayı yayınla", "temayı geri al", "mağaza seç" gibi isteklerde kullan. Tema DOSYALARINI yazmak için estorepark-theme skill'ini kullan.
license: MIT
compatibility: Node.js 24+ ve `estorepark` CLI. Ağa çıkan komutlar erişilebilir bir EstorePark ortamı ve oturum ister.
metadata:
  author: estorepark
  version: "0.1.0"
---

# EstorePark CLI

Mağaza sahiplerinin terminalden tema geliştirip yayınladığı CLI. Bu skill **komutu sürmeyi**
anlatır; tema dosyalarının içeriği için `estorepark-theme` skill'i kullanılır.

## Kurulum ve durum

CLI henüz npm'e yayınlanmadı. Bugün kaynaktan çalıştırılır:

```bash
pnpm install && pnpm build   # dist/main.js
node dist/main.js --help
```

Ağa çıkmayan komutlar (`theme check`, `theme package`) her ortamda çalışır. `login` ve
sunucuya giden komutlar, ortamın dağıtılmış olmasını gerektirir — bağlanamıyorsa bu bir kod
hatası değil, ortam eksikliğidir; kullanıcıya söyleyin, komutu bayrak deneyerek "düzeltmeye"
çalışmayın.

## Tipik akış

```bash
estorepark login                 # tarayıcıda kod onaylanır (OAuth2 device flow)
estorepark store use magazam     # aktif mağaza
estorepark theme init            # klasörü temaya bağlar + DRAFT'ı indirir
estorepark theme dev             # localhost:9292 → gerçek veri + yerel dosyalar
estorepark theme check           # yerel yapısal doğrulama (ağa çıkmaz)
estorepark theme push            # DRAFT'ı GÜNCELLER (yayınlamaz)
estorepark theme publish         # onay ister → yayınlar VE canlı yapar
```

Komut ve bayrakların tam listesi: [references/commands.md](references/commands.md).

## Tuzaklar

Bunlar makul varsayımın yanlış olduğu yerler — komutu kurmadan önce okuyun.

- **`theme push` DRAFT'ı EZER, merge etmez.** `theme init`/`theme pull` binary asset
  (görsel, font) indirmez çünkü sunucu yalnız metin dosyası döndürür. Bu yüzden
  `init → push` turu **sunucudaki asset'leri siler**, `publish` bunu canlı yapar. CLI riski
  ölçemediği için her `push` uyarır ve `--json` gövdesine `warnings: ["DRAFT_REPLACED"]` koyar.
  Görselleri olan bir temada `push` etmeden önce kullanıcıyı uyarın.
- **`theme dev --json` çıktısını boruya vermeyin.** Komut uzun ömürlüdür: proxy dinlemeye
  başladığı anda tek bir "hazır" dokümanı basar ama süreç bitmediği için stdout'a EOF gelmez.
  `| jq` girdiyi EOF'ta boşalttığından kilitlenir. **Dosyaya yönlendirin:**
  `estorepark theme dev --json --no-input > dev.json &`
- **`--json` çıktısındaki `sessionIdPrefix` bir yetenek anahtarının parçasıdır.** Önizleme
  session'ı `<mağaza-host>/?epid=…` ile temayı açar. Bu değeri CI log'una, issue'ya veya
  chat'e yapıştırmayın.
- **`publish` ve `rollback` onay ister.** TTY'de onay kutusu açılır (Enter = hayır).
  Script/CI'da `--yes` verilmezse komut **çıkış 2** ile durur ve mutation hiç gitmez.
  Kullanıcı açıkça istemeden `--yes` eklemeyin — canlı vitrini değiştiren tek komutlar bunlar.
- **Token'lar `~/.config/estorepark/config.json` dosyasındadır (izin 0600).** CLI'ın token
  bayrağı ya da env değişkeni **yoktur**; token'lar log'a, hata çıktısına ve `--json` gövdesine
  asla yazılmaz. Config dosyasını okuyup içeriğini ekrana basmayın.
- **Eksik argüman = interaktif liste, CI'da hata.** `store use`, `theme init` ve
  `theme rollback` argüman verilmezse TTY'de seçim listesi açar. `--no-input`, dolu bir `CI`
  ortam değişkeni **ve `--json`** bunu kapatır → argüman eksikse çıkış 2. Otomasyonda her
  zaman argümanı açıkça verin.
- **`--json` prompt'ları da kapatır.** Ajan olarak `--json` ile çalışıyorsanız onay kutusu
  hiç açılmaz: `publish`/`rollback` `--yes` olmadan **daima** `CONFIRMATION_REQUIRED` (çıkış 2)
  verir. Bu bir hata değil, kapının çalıştığının işaretidir — kullanıcıya sorun.
- **Bilinmeyen bayrak sessizce yutulmaz** (`UNKNOWN_FLAG`, çıkış 2). Yazım hatası (`--jsom`)
  komutu farklı çalıştırmaz, durdurur.

## `--json` sözleşmesi

`--json` altında **stdout yalnız tek bir JSON dokümanı taşır**; ilerleme ve uyarı satırları
stderr'e gider. Yani `estorepark theme list --json | jq` daima çalışır (tek istisna yukarıdaki
`theme dev`).

Hata gövdesi:

```json
{ "ok": false, "error": { "code": "NO_STORE_SELECTED", "message": "…" } }
```

Script `error.code`'a bakmalı, mesaj metnine değil. Kod listesi ve ne yapılacağı:
[references/errors.md](references/errors.md). Çıktı gövdelerinin şekli:
[references/json-contract.md](references/json-contract.md).

## Çıkış kodları

| Kod | Anlamı | Ajanın tepkisi |
| --- | ------ | -------------- |
| `0` | Başarı | devam |
| `1` | Komut çalıştı, sonuç olumsuz ∨ beklenmeyen hata (`theme check` bulgusu, 5xx, ağ, onayda "hayır") | çıktıyı oku, bulguyu düzelt; ağ/5xx ise tekrar denemek yerine kullanıcıya bildir |
| `2` | Komut yanlış çağrıldı (eksik argüman, bilinmeyen bayrak, mağaza seçilmemiş, onaysız `publish`) | komutu düzelt; `--yes`'i kendiliğinden ekleme |
| `3` | Kimlik/yetki (oturum yok ∨ süresi dolmuş, yetersiz scope) | `estorepark login` gerekir — kullanıcıya söyle, tarayıcı akışını sen tamamlayamazsın |

## CI'da çalıştırma

```bash
CI=1 estorepark theme check --dir ./tema --json
CI=1 estorepark theme push --dir ./tema --store magazam --json
CI=1 estorepark theme publish --store magazam --yes --json
```

`--no-input` ∨ `CI=1` tüm interaktif yüzeyleri kapatır; her komutun tam non-interactive
karşılığı vardır ve hiçbiri TTY gerektirmez.

## Yapılandırma

| Yer | Ne |
| --- | -- |
| `~/.config/estorepark/config.json` | Oturum token'ları + aktif mağaza (izin 0600) |
| `<tema>/.estorepark/theme.json` | Klasörün bağlı olduğu mağaza + tema id'si |
| `<tema>/.estorepark/theme.zip` | `theme package` varsayılan çıktısı — pakete girmez |
| `ESTOREPARK_API_BASE` / `ESTOREPARK_ACCOUNTS_BASE` | Ortam kökleri (`--api` / `--accounts` önceliklidir) |
| `ESTOREPARK_CONFIG_HOME` | Config dizinini değiştirir (test + CI) |

`.estorepark/` CLI'ın sahiplendiği tek dizindir; içeriğini elle düzenlemeyin.
