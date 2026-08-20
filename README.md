# EstorePark Agent Skills

[EstorePark](https://estorepark.com) için [Agent Skills](https://agentskills.io) formatında
skill koleksiyonu. Skill'ler, kod yazan AI ajanlarına (Claude Code, Codex, Cursor, Copilot,
Gemini CLI, OpenCode…) EstorePark CLI'ını ve tema bundle sözleşmesini **doğru** kullanmayı
öğretir — ajanın kendiliğinden bilemeyeceği kuralları, tuzakları ve komut sözleşmelerini taşır.

## Kurulum

```bash
# Tüm skill'ler, kullandığınız ajana
npx skills add Estorepark/skills

# Yalnız bir skill
npx skills add Estorepark/skills --skill estorepark-theme

# Belirli ajanlara, soru sormadan (CI)
npx skills add Estorepark/skills -a claude-code -y
```

Kurmadan tek seferlik kullanmak için:

```bash
npx skills use Estorepark/skills@estorepark-cli | claude
```

Claude Code'da plugin olarak da eklenebilir:

```
/plugin marketplace add Estorepark/skills
```

Skill'ler ajan bağımsızdır; `SKILL.md` dosyalarını elle kopyalamak da çalışır
(`.claude/skills/`, `.agents/skills/` … hedefiniz hangisiyse).

## Skill'ler

| Skill | Ne zaman devreye girer |
| ----- | ---------------------- |
| [`estorepark-cli`](skills/estorepark-cli) | `estorepark` komutunu sürmek: cihaz girişi, mağaza seçimi, `theme init/dev/check/package/push/publish/rollback`, `--json` çıktısı, çıkış kodları, CI kullanımı |
| [`estorepark-theme`](skills/estorepark-theme) | Tema **kodu** yazmak: section/block/template/region dosyaları, `config/routes.json`, gömülü şema, helper kataloğu, i18n |

İkisi ayrı çünkü biri **komutu sürmeyi**, diğeri **tema kodu yazmayı** anlatır; bir işte
yalnız biri gerekebilir ve içerikleri örtüşmez.

## Katkı

Skill yazım kuralları [AGENTS.md](AGENTS.md)'de. Değişiklikten önce doğrulayıcıyı çalıştırın:

```bash
node scripts/validate-skills.mjs
```

CI aynı script'i koşar; frontmatter, isim kuralları, boyut sınırları ve ölü referans linkleri
kontrol edilir.

## Lisans

[MIT](LICENSE)
