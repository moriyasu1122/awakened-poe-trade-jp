// awakened-poe-trade-jp 用 データ抽出スクリプト
// 使い方:
//   1) このフォルダ(poe_dat_export)で以下を実行:
//        npm install poe-dat-export
//        node run-export.mjs
// config.json で指定したテーブルを GGG の公式アップデートサーバーから
// 直接ダウンロードして tables/<言語>/<テーブル名>.json に書き出します。
// ※ PoE クライアントのインストールは不要です(オンラインから取得します)。

import { Exporter, Loaders, Language } from 'poe-dat-export'
import fs from 'fs'
import path from 'path'

const CONFIG_PATH = './config.json'
const OUT_DIR = './tables'

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))

const loader = new Loaders.OnlineBundleLoader({})
const exporter = new Exporter.DatExporter({ bundleLoader: loader })

const LANG_MAP = {
  English: Language.English,
  Japanese: Language.Japanese
}

for (const langName of config.translations) {
  const lang = LANG_MAP[langName]
  if (lang === undefined) {
    console.error(`未対応の言語: ${langName}`)
    continue
  }
  const outDir = path.join(OUT_DIR, langName)
  fs.mkdirSync(outDir, { recursive: true })

  for (const table of config.tables) {
    console.log(`Exporting ${table.name} (${langName})...`)
    const rows = await exporter.export(table.name, lang)
    const filtered = rows.map(row => {
      const out = {}
      if ('_index' in row) out._index = row._index
      for (const col of table.columns) {
        out[col] = row[col]
      }
      return out
    })
    const outPath = path.join(outDir, `${table.name}.json`)
    fs.writeFileSync(outPath, JSON.stringify(filtered, null, 0), 'utf-8')
    console.log(`  -> ${outPath} (${filtered.length} rows)`)
  }
}

console.log('完了しました。')
