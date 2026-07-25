import fnv1a from '@sindresorhus/fnv1a'
import fs from 'fs'

const INDEX_WIDTH = 2

function dataBinarySearch(data, value, rowOffset, rowSize) {
  let left = 0
  let right = (data.length / rowSize) - 1
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const midValue = data[(mid * rowSize) + rowOffset]
    if (midValue < value) left = mid + 1
    else if (midValue > value) right = mid - 1
    else return mid
  }
  return -1
}

const ndjson = fs.readFileSync('./public/data/ja/items.ndjson', { encoding: 'utf-8' })
const indexNamesBuf = fs.readFileSync('./public/data/ja/items-name.index.bin')
const indexRefBuf = fs.readFileSync('./public/data/ja/items-ref.index.bin')
const indexNames = new Uint32Array(indexNamesBuf.buffer, indexNamesBuf.byteOffset, indexNamesBuf.length / 4)
const indexRef = new Uint32Array(indexRefBuf.buffer, indexRefBuf.byteOffset, indexRefBuf.length / 4)

function commonFind(index, prop) {
  return function (ns, name) {
    let start = dataBinarySearch(index, Number(fnv1a(`${ns}::${name}`, { size: 32 })), 0, INDEX_WIDTH)
    if (start === -1) return undefined
    start = index[start * INDEX_WIDTH + 1]
    const out = []
    while (start !== ndjson.length) {
      const end = ndjson.indexOf('\n', start)
      const record = JSON.parse(ndjson.slice(start, end))
      if (record.namespace === ns && record[prop] === name) {
        out.push(record)
        if (!record.disc && !record.unique) break
      } else { break }
      start = end + 1
    }
    return out
  }
}

const byName = commonFind(indexNames, 'name')
const byRef = commonFind(indexRef, 'refName')

console.log('lookup by JA name (鉄のセプター):', JSON.stringify(byName('ITEM', '鉄のセプター')))
console.log('lookup by refName (Iron Sceptre):', JSON.stringify(byRef('ITEM', 'Iron Sceptre')))
console.log('lookup by JA name (改変のオーブ):', JSON.stringify(byName('ITEM', '改変のオーブ')))
console.log('lookup by JA name WRONG english (Iron Sceptre) via byName:', JSON.stringify(byName('ITEM', 'Iron Sceptre')))
