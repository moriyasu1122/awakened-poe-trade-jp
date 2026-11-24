// Modの説明文ファイル(stat_descriptions)をゲームデータから取り出すスクリプト
// 全言語の訳が入っているので、日本語のMod表記を正確に知るために使う
//
// 使い方(poe_dat_export フォルダで):
//   npm install          (初回のみ)
//   node export-stat-descriptions.mjs
// config.json の "patch" のバージョンのデータを取得し、stat_descriptions フォルダに保存する

import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

const loadersPath = path.resolve('node_modules/pathofexile-dat/dist/cli/bundle-loaders.js')
const loaders = await import(pathToFileURL(loadersPath).href)

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'))

// 最新のパッチ番号を取得して config.json に反映する
// (データ配信サーバーには最新版しか無いので、古い番号のままだと取得に失敗する)
try {
  const res = await fetch('https://raw.githubusercontent.com/poe-tool-dev/latest-patch-version/main/latest.txt')
  const latest = (await res.text()).trim()
  if (res.ok && /^\d+(\.\d+)+$/.test(latest) && latest !== config.patch) {
    console.log(`パッチ番号を更新します: ${config.patch} → ${latest}`)
    config.patch = latest
    const raw = fs.readFileSync('config.json', 'utf-8')
    fs.writeFileSync('config.json', raw.replace(/"patch":\s*"[^"]*"/, `"patch": "${latest}"`))
  }
} catch (e) {
  console.log('最新のパッチ番号を確認できませんでした。config.json の番号を使います。')
}
const OUT_DIR = 'stat_descriptions'
const FILES = [
  'stat_descriptions',
  'map_stat_descriptions',
  'atlas_stat_descriptions',
  'advanced_mod_stat_descriptions',
  'passive_skill_stat_descriptions',
  'heist_equipment_stat_descriptions',
  'sanctum_relic_stat_descriptions',
  'expedition_relic_stat_descriptions',
  'tincture_stat_descriptions',
  'primordial_altar_stat_descriptions',
  'village_stat_descriptions',
  'graft_stat_descriptions',
  'chest_stat_descriptions'
]

console.log(`パッチ ${config.patch} のデータを読み込んでいます...`)
const loader = await loaders.FileLoader.create(
  new loaders.CachingBundleLoader(await loaders.CdnBundleLoader.create(path.resolve('.cache'), config.patch)))

fs.mkdirSync(OUT_DIR, { recursive: true })
let ok = 0
for (const name of FILES) {
  // 3.30から拡張子が .txt → .csd に変わったので両方探す
  let contents = null
  let ext = null
  for (const e of ['.csd', '.txt']) {
    contents = await loader.tryGetFileContents(`Metadata/StatDescriptions/${name}${e}`)
    if (contents) { ext = e; break }
  }
  if (!contents) {
    console.log(`  (見つかりません) Metadata/StatDescriptions/${name}`)
    continue
  }
  fs.writeFileSync(path.join(OUT_DIR, `${name}${ext}`), contents)
  console.log(`  保存しました: ${OUT_DIR}/${name}${ext} (${Math.round(contents.length / 1024)} KB)`)
  ok += 1
}
console.log(`完了しました。${ok} 個のファイルを保存しました。`)
