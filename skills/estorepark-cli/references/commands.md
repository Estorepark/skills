# Komut ve bayrak referansı

`estorepark --help` çıktısının açıklamalı hâli. Komut adları ve bayraklar birebir bunlardır;
listede olmayan bir bayrak `UNKNOWN_FLAG` ile çıkış 2 verir.

## Oturum

| Komut | Ne yapar |
| ----- | -------- |
| `estorepark login` | Tarayıcıdan onaylanan cihaz girişi (OAuth2 device flow). Parola CLI'dan geçmez. Ajan bu akışı tamamlayamaz — kod kullanıcıya gösterilir. |
| `estorepark logout` | Yerel oturumu siler |
| `estorepark whoami` | Oturum + erişilebilen mağaza sayısı |

## Mağaza

| Komut | Ne yapar |
| ----- | -------- |
| `estorepark store list` | Erişilebilen mağazalar |
| `estorepark store use <slug>` | Aktif mağazayı seçer (config'e yazılır) |

Login **platform seviyesindedir**; hangi mağazada çalışılacağı CLI'dan seçilir. Yetki sınırını
mağazadaki staff izinleri çizer. Tek komutluk sapma için `--store <slug>` yeterlidir, aktif
mağazayı değiştirmek gerekmez.

## Tema

| Komut | Ne yapar | Ağ |
| ----- | -------- | -- |
| `theme init` | Klasörü bir temaya bağlar (`.estorepark/theme.json`) + DRAFT dosyalarını indirir | ✔ |
| `theme list` | Mağazanın temaları | ✔ |
| `theme dev` | Yerel proxy (varsayılan `localhost:9292`): render sunucuda gerçek tenant verisiyle olur, dosyalar yerelden gider | ✔ |
| `theme preview` | Tek seferlik önizleme URL'i (proxy yok) | ✔ |
| `theme check` | Yerel yapısal doğrulama | ✘ |
| `theme package` | Deterministik zip üretir (varsayılan `.estorepark/theme.zip`) | ✘ |
| `theme push` | Yükler ve DRAFT olarak indeksler — **yayınlamaz**, DRAFT'ı ezer | ✔ |
| `theme publish` | DRAFT'ı yayınlar VE canlı yapar — onay ister | ✔ |
| `theme versions` | Yayın geçmişi (`--limit` / `--offset`, varsayılan 20 / 0) | ✔ |
| `theme rollback --version N` | Eski bir sürümü tekrar canlı yapar — onay ister | ✔ |
| `theme pull` | DRAFT dosyalarını diske yazar | ✔ |

`theme dev` sırasında `assets/` altındaki dosyalar **doğrudan yerel klasörden** servis edilir
(görsel ve fontlar dahil); önizleme session'ı yalnız metin taşıdığı için binary asset'ler
sunucuya gitmez. Yerelde olmayan bir asset sunucudaki DRAFT'tan gelir.

`theme init` argümansız çağrılınca TTY'de tema seçim listesi açar; liste kapalıyken mağazanın
canlı temasını seçer ve hangisini seçtiğini stderr'e yazar.

## Bayraklar

| Bayrak | Anlamı |
| ------ | ------ |
| `--store <slug>` | Mağaza (varsayılan: `store use` ile seçilen) |
| `--theme <id>` | Tema (varsayılan: `.estorepark/theme.json`) |
| `--dir <yol>` | Tema klasörü (varsayılan: bulunulan dizin) |
| `--port <n>` | `theme dev` yerel portu (varsayılan 9292) |
| `--name <ad>` | `theme init` ile yeni tema adı |
| `--out <dosya>` | `theme package` çıktı yolu |
| `--version <n>` | `theme rollback` hedef sürümü |
| `--limit <n>` `--offset <n>` | `theme versions` sayfalama |
| `--json` | Makine-okur çıktı (stdout'ta tek JSON dokümanı) |
| `--quiet` | Yalnız hataları bas |
| `--no-input` | İnteraktif yüzeyi kapat (CI). `CI=1` ile aynı etki. |
| `--yes` | Canlıyı etkileyen işlemleri sormadan onayla (`publish`, `rollback`) |
| `--api <url>` `--accounts <url>` | Ortam kökleri (env: `ESTOREPARK_API_BASE` / `ESTOREPARK_ACCOUNTS_BASE`) |
| `-h, --help` | Yardım |
| `--version` | CLI sürümü (komut verilmediğinde; `--version-cli` eş anlamlı) |

`--version` iki anlamlıdır: komutsuz çağrıda CLI sürümünü basar, `theme rollback` ile hedef
sürüm numarasıdır.

## İnteraktif yüzeyler

Yalnız stdout **ve** stdin birlikte TTY iken ve gerekli argüman verilmemişken açılır.

| Komut | Eksik olan | Kaçış bayrağı |
| ----- | ---------- | ------------- |
| `store use` | mağaza | `<slug>` ∨ `--store <slug>` |
| `theme init` | tema | `--theme <id>` ∨ `--name "<ad>"` |
| `theme rollback` | sürüm | `--version <n>` |

Listede `↑↓` gez · `Enter` seç · `1-9` doğrudan seç · `/` filtrele · `Esc` iptal. İptal,
argüman verilmemiş gibi davranır (çıkış 2).
