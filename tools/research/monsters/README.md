# Monster research tools

Validate, audit, and export the monster database described in `docs/research/monsters/schema/SCHEMA.md`.

These commands do not touch the battle engine, gacha rates, or production assets. They read JSON files and write a workbook or an import JSON.

```bash
node tools/research/monsters/validate.mjs \
  --input docs/research/monsters/schema/examples/sample-database.json

node tools/research/monsters/build-workbook.mjs \
  --input docs/research/monsters/creative/parody/sample_normal_elite.json \
  --input docs/research/monsters/creative/bosses/sample_bosses.json \
  --lore docs/research/monsters/lore/sample_lore_links.json \
  --qa docs/research/monsters/qa/sample_qa.json \
  --out monsters.xlsx

node tools/research/monsters/export-json.mjs \
  --input docs/research/monsters/creative/parody/sample_normal_elite.json \
  --input docs/research/monsters/creative/bosses/sample_bosses.json \
  --lore docs/research/monsters/lore/sample_lore_links.json \
  --qa docs/research/monsters/qa/sample_qa.json \
  --out monsters.import.json
```

`sample-database.json` is a structural fixture with `example.com` URLs. It is not a research citation. Point the same flags at the merged agent files when agents 06, 07, 08, and 10 publish them.

`--help` lists every flag. Exit 0 is clean, exit 1 is a failed check, exit 2 is a bad path or argument.
