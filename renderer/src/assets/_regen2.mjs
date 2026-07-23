import fnv1a from '@sindresorhus/fnv1a'
import fs from 'fs'
import path from 'path'
const lang = 'ja'
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
      start
    })
  }
  start = end + 1
}
const lineStarts = Array.from(startsByName.values())
{
  const d = new Uint32Array(lineStarts.length * 2)
  lineStarts.sort((a,b)=>a.hashName-b.hashName)
  lineStarts.forEach((x,i)=>{ d[i*2]=x.hashName; d[i*2+1]=x.start })
  fs.writeFileSync(path.join('./public/data', lang, 'items-name.index.bin'), d)
}
{
  const d = new Uint32Array(lineStarts.length * 2)
  lineStarts.sort((a,b)=>a.hashRefName-b.hashRefName)
  lineStarts.forEach((x,i)=>{ d[i*2]=x.hashRefName; d[i*2+1]=x.start })
  fs.writeFileSync(path.join('./public/data', lang, 'items-ref.index.bin'), d)
}
console.log('regenerated', lineStarts.length, 'entries')
