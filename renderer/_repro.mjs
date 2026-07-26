import { createServer } from 'vite'

const server = await createServer({
  configFile: './vite.config.mts',
  server: { middlewareMode: true },
  appType: 'custom'
})

try {
  const mod = await server.ssrLoadModule('/src/parser/Parser.ts')
  const clipboard = `アイテムクラス: ジュエル
レアリティ: レア
嫌悪する薄片
クラスタージュエル (中)
--------
幽体化度: 14%
--------
装備要求:
レベル: 54
--------
アイテムレベル: 72
--------
パッシブスキルを4個追加する (enchant)
(追加されたパッシブスキルは他のジュエルの範囲内にあるとみなされることはない) (enchant)
(追加されるパッシブスキルは別途明記されない限り通常パッシブである) (enchant)
ジュエルソケット1個がパッシブスキルに追加される (enchant)
追加される通常パッシブスキルは付与: ヘラルドの影響を受けている時にダメージが10%増加する (enchant)
(特殊パッシブ、マスタリー、キーストーン、ジュエルソケット以外のパッシブスキルを通常パッシブという) (enchant)
--------
{ プレフィックスモッド「特殊な」 (ティア: 1) — ダメージ }
パッシブスキルを1個追加: 終焉をもたらす者
{ プレフィックスモッド「特殊な」 (ティア: 1) — ダメージ }
パッシブスキルを1個追加: 権限を持つ使者
{ サフィックスモッド 「クリスタルの」 (ティア: 3) — 元素, 耐性 }
追加されるスモールパッシブスキルはさらに付与: 全ての元素耐性 +2%
{ サフィックスモッド 「迷い子の」 (ティア: 3) — 混沌, 耐性 }
追加されるスモールパッシブスキルはさらに付与: 混沌耐性 +3%
--------
パッシブツリーで割り当てられたジュエルソケット(大)または(中)にはめる。追加されたパッシブは他の半径を持つジュエルと相互作用しない。右クリックしてソケットから取り外すことができる。`

  console.log('typeof parseClipboard:', typeof mod.parseClipboard)
  const result = mod.parseClipboard(clipboard)
  console.log('RESULT isOk:', result.isOk())
  if (result.isOk()) {
    console.log(JSON.stringify(result.value, null, 2).slice(0, 3000))
  } else {
    console.log('ERROR VALUE:', result.error)
  }
} catch (e) {
  console.log('EXCEPTION THROWN:')
  console.log(e.stack || e)
} finally {
  await server.close()
}
