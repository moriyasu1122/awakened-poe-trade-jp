// 日本語アイテムデータ(ja/items.ndjson)を、最新の英語データ(en/items.ndjson)から作り直すスクリプト
//
// 使い方(renderer フォルダで):  node build-ja-items.mjs
//
// - 各行は en/items.ndjson の行をそのまま使い、"name" だけを日本語に置き換える
//   (本家がアイコンやトレード情報などを更新しても、自動的に追従できる)
// - 日本語名は、まず今の ja/items.ndjson の訳を使う(手で直した訳を残すため)
// - 無い場合(新リーグの新アイテムなど)は、ゲームデータ(../poe_dat_export/tables)から日本語名を取る
//     ユニーク: Words / エリア: WorldAreas / それ以外: BaseItemTypes
//   ゲームデータは poe_dat_export フォルダで「npx pathofexile-dat」を実行すると最新になる
// - 英語名のまま残ったアイテムは最後に一覧表示する

import fs from 'fs'

const EN_PATH = 'public/data/en/items.ndjson'
const JA_PATH = 'public/data/ja/items.ndjson'
const TABLES = '../poe_dat_export/tables'

const readLines = (p) => fs.readFileSync(p, 'utf-8').split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim())
const readTable = (lang, name) => JSON.parse(fs.readFileSync(`${TABLES}/${lang}/${name}.json`, 'utf-8'))

// 英語名 → 日本語名 (同じ英語名に複数の訳がある場合は曖昧なので使わない)
function makeMap (name, col) {
  const en = readTable('English', name)
  const ja = readTable('Japanese', name)
  const map = new Map()
  for (let i = 0; i < en.length; i += 1) {
    const e = en[i][col]; const j = ja[i][col]
    if (!e || !j) continue
    if (!map.has(e)) map.set(e, new Set())
    map.get(e).add(j)
  }
  const out = new Map()
  for (const [k, v] of map) if (v.size === 1) out.set(k, [...v][0])
  return out
}

const BASE = makeMap('BaseItemTypes', 'Name')
const WORDS = makeMap('Words', 'Text2')
const AREAS = makeMap('WorldAreas', 'Name')

const current = new Map()
for (const line of readLines(JA_PATH)) {
  const o = JSON.parse(line)
  const key = `${o.namespace}|${o.refName}`
  if (!current.has(key)) current.set(key, o.name)
}

const stats = { kept: 0, fromGameData: 0, english: 0 }
const englishLeft = []
const out = readLines(EN_PATH).map(line => {
  const o = JSON.parse(line)
  const key = `${o.namespace}|${o.refName}`
  let name = current.get(key)
  if (name != null && name !== o.name) {
    stats.kept += 1
  } else {
    let fromData
    if (o.namespace === 'UNIQUE') fromData = WORDS.get(o.refName)
    else if (o.namespace === 'AREA') fromData = AREAS.get(o.refName)
    else if (o.namespace !== 'MERCENARY_BUILD') fromData = BASE.get(o.refName)
    if (fromData) {
      name = fromData
      stats.fromGameData += 1
    } else {
      name = name ?? o.name
      if (name === o.name) { stats.english += 1; englishLeft.push(key) } else stats.kept += 1
    }
  }
  // "name" は各行の先頭にあるので、その値だけを置き換える
  const prefix = '{"name":' + JSON.stringify(o.name)
  if (!line.startsWith(prefix)) throw new Error('想定外の行の形式です: ' + line.slice(0, 80))
  return '{"name":' + JSON.stringify(name) + line.slice(prefix.length)
})

fs.writeFileSync(JA_PATH, out.join('\n') + '\n', 'utf-8')
console.log(`完了しました。${out.length} 行を ${JA_PATH} に書き出しました。`)
console.log(`  既存の訳を使用: ${stats.kept} / ゲームデータから: ${stats.fromGameData} / 英語のまま: ${stats.english}`)
const byNs = {}
for (const k of englishLeft) { const ns = k.split('|')[0]; byNs[ns] = (byNs[ns] ?? 0) + 1 }
console.log('  英語のまま(種類別):', byNs)
