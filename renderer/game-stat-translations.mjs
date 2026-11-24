// ゲームデータのMod説明文(poe_dat_export/stat_descriptions/*.csd)から、
// 英語のMod文言 → 日本語のMod文言 の対応表を作る (build-ja-stats.mjs から使う)
//
// 説明文ファイルは poe_dat_export フォルダの get_stat_descriptions.bat で取得する

import fs from 'fs'
import path from 'path'

const DIR = '../poe_dat_export/stat_descriptions'

// 説明文の文言を、Awakened PoE Trade の照合用の形(数値部分を # にしたもの)に変換する
export function toMatcherForm (text) {
  return text
    .replace(/\\n/g, '\n')
    // [表示名] / [ID|表示名] のマークアップ → 表示名
    .replace(/\[([^\]|]*)\|([^\]]*)\]/g, '$2')
    .replace(/\[([^\]]*)\]/g, '$1')
    // 数値の置き換え。符号はアイテムのテキストでは数値側に含まれるので取り除く
    .replace(/[+-]?\{[^}]*\}/g, '#')
}

function parseFile (file, out) {
  const text = fs.readFileSync(file).toString('utf16le').replace(/^﻿/, '')
  const lines = text.split(/\r?\n/)
  let i = 0
  const readVariants = () => {
    const count = Number(lines[i++].trim())
    const variants = []
    for (let k = 0; k < count; k += 1) {
      const m = /^\s*(.*?)\s*"((?:[^"\\]|\\.)*)"(.*)$/.exec(lines[i++])
      if (!m) continue
      variants.push({ cond: m[1].trim().split(/\s+/).join(' '), text: m[2], handlers: m[3].trim() })
    }
    return variants
  }
  while (i < lines.length) {
    const line = lines[i]
    if (!/^description\b/.test(line)) { i += 1; continue }
    i += 1
    i += 1 // stat id の行
    try {
      const en = readVariants()
      const langs = {}
      while (i < lines.length && /^\s*lang "/.test(lines[i])) {
        const lang = /lang "([^"]+)"/.exec(lines[i])[1]
        i += 1
        langs[lang] = readVariants()
      }
      const ja = langs.Japanese
      if (!ja) continue
      for (const e of en) {
        // 条件(数値の範囲など)と処理内容が同じものを対応させる
        const j = ja.find(v => v.cond === e.cond && v.handlers === e.handlers) ??
                  ja.find(v => v.cond === e.cond)
        if (!j) continue
        const enForm = toMatcherForm(e.text)
        const jaForm = toMatcherForm(j.text)
        if (!out.has(enForm)) out.set(enForm, new Set())
        out.get(enForm).add(jaForm)
      }
    } catch {
      // 形式が想定外のブロックは読み飛ばす
    }
  }
}

// 戻り値: Map<英語の照合用文言, Set<日本語の照合用文言>> (ファイルが無ければ空)
export function loadGameStatTranslations () {
  const out = new Map()
  if (!fs.existsSync(DIR)) return out
  for (const f of fs.readdirSync(DIR)) {
    if (f.endsWith('.csd') || f.endsWith('.txt')) parseFile(path.join(DIR, f), out)
  }
  return out
}
