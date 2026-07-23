import fnv1a from '@sindresorhus/fnv1a'
import fs from 'fs'
import path from 'path'

const LANGUAGES = ['ja']

for (const lang of LANGUAGES) {
  let lineStarts
  {
    const ndjson = fs.readFileSync(`./public/data/${lang}/items.ndjson`, { encoding: 'utf-8' })
    let start = 0
    const startsByName = new Map()
    while (start !== ndjson.length) {
      const end = ndjson.indexOf('\n', start)
      const item = JSON.parse(ndjson.slice(start, end))
      const key = `${item.namespace}::${item.refName}`
      if (!startsByName.has(key)) {
        startsByName.set(key, {
          hashName: Number(fnv1a(`${item.namespace}::${item.name}`, { size: 32 })),
          hashRefName: Number(fnv1a(`${item.namespace}::${item.refName}`, { size: 32 })),
          start: start
        })
      }
      start = (end + 1)
    }
    lineStarts = Array.from(startsByName.values())
  }

  {
    const indexData = new Uint32Array(lineStarts.length * 2)
    lineStarts.sort((a, b) => a.hashName - b.hashName)
    for (let i = 0; i < lineStarts.length; i += 1) {
      indexData[i * 2 + 0] = lineStarts[i].hashName
      indexData[i * 2 + 1] = lineStarts[i].start
    }
    fs.writeFileSync(path.join('./public/data', lang, 'items-name.index.bin'), indexData)
  }
  {
    const indexData = new Uint32Array(lineStarts.length * 2)
    lineStarts.sort((a, b) => a.hashRefName - b.hashRefName)
    for (let i = 0; i < lineStarts.length; i += 1) {
      indexData[i * 2 + 0] = lineStarts[i].hashRefName
      indexData[i * 2 + 1] = lineStarts[i].start
    }
    fs.writeFileSync(path.join('./public/data', lang, 'items-ref.index.bin'), indexData)
  }
  console.log('done', lang, lineStarts.length, 'entries')
}
