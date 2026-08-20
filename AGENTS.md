# Bu repoda skill nasıl yazılır

Kaynak: [Agent Skills specification](https://agentskills.io/specification) ve
[best practices](https://agentskills.io/skill-creation/best-practices). Aşağıdakiler bu
repoya özel kurallardır — spec'i tekrar etmez, daraltır.

## Değişmezler

1. **Dizin adı = `name`.** Spec şartı. Dizin `skills/<name>/`, içinde `SKILL.md`.
2. **`estorepark-` prefix'i zorunlu.** Skill'ler tüketicide düz bir dizine kurulur
   (`.claude/skills/`, `.agents/skills/`) — isim alanı globaldir. Prefix'siz bir `theme`
   skill'i başka bir repodan gelenle çakışır.
3. **`SKILL.md` ≤ 500 satır.** Detay `references/` altına gider ve gövdeden **ne zaman
   okunacağı** söylenerek referans verilir ("sunucu 4xx dönerse `references/errors.md`'yi oku").
   Genel "detaylar için references/'a bak" satırı işe yaramaz.
4. **Dil: gövde İngilizce.** Repo public'tir ve skill'ler ajan-bağımsız tüketilir; gövde
   İngilizce yazılır. `description` alanı ise **iki dillidir**: aktivasyon tamamen description
   eşleşmesine bakar, kullanıcılarımız Türkçe prompt yazar → İngilizce "ne + ne zaman"
   cümlesinin yanına Türkçe tetik ifadeleri de konur. Merchant'ın göreceği örnek değerler
   (tema `label`/`default` metinleri) mağazanın dilinde yazılır — bu bir istisna değil, örnek
   verinin doğal dili.
5. **Gerçek yüzeyden yaz.** Komut, bayrak, hata kodu ve dosya adları CLI/monorepo
   kaynağından doğrulanarak yazılır. Uydurulmuş bayrak, ajanı deneme-yanılmaya sokar.
6. **Sır yok.** Token, gerçek mağaza slug'ı, iç altyapı adresi (APISIX route'ları, iç
   servis host'ları) skill'e girmez. Bu repo public'tir.

## İçerik önceliği

En değerli bölüm **Tuzaklar**tır: ajanın makul varsayımının yanlış olduğu yerler
(`theme push` DRAFT'ı ezer, şema `default`'u render'da uygulanmaz…). Sıradan bilgi
(bir zip nedir, HTTP nasıl çalışır) yazılmaz.

Bir düzeltme yaptığınızda — ajan bir işi yanlış yaptı, siz düzelttiniz — düzeltmeyi ilgili
skill'in Tuzaklar bölümüne ekleyin. Skill'i iyileştirmenin en doğrudan yolu budur.

## Frontmatter

Spec'in izin verdiği alanlar: `name`, `description`, `license`, `compatibility`,
`metadata`, `allowed-tools`. Bu repoda:

```yaml
---
name: estorepark-<konu>
description: <İngilizce ne + ne zaman>. <Türkçe tetik ifadeleri>.
license: MIT
metadata:
  author: estorepark
  version: "0.1.0"
---
```

`version` elle artırılır; `npx skills update` default branch'ten çeker, semver çözümü
yoktur → `main` her an yayınlanabilir olmalı.

## Doğrulama

```bash
node scripts/validate-skills.mjs
```

Kontrol ettikleri: frontmatter varlığı/alanları, `name` regex + dizin eşleşmesi,
`description` uzunluğu, `SKILL.md` satır sayısı, gövdedeki relative linklerin varlığı,
`skills.sh.json` ve `.claude-plugin/marketplace.json`'ın her skill'i kapsaması.

## Yeni skill eklerken

1. `skills/estorepark-<ad>/SKILL.md` oluştur.
2. `skills.sh.json` içindeki uygun gruba adı ekle (yoksa yeni grup).
3. `.claude-plugin/marketplace.json` → `plugins[0].skills` listesine yolu ekle.
4. README tablosuna bir satır.
5. `node scripts/validate-skills.mjs`.
