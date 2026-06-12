// One-off codemod: normalize YouTube URLs in src/data/modules.js
//   https://youtu.be/ID            -> https://www.youtube.com/watch?v=ID
//   https://youtube.com/shorts/ID  -> https://www.youtube.com/shorts/ID
//   https://youtube.com/playlist?  -> unchanged
// Run: node scripts/convertUrls.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = new URL('../src/data/modules.js', import.meta.url)
let src = readFileSync(FILE, 'utf8')

let shortCount = 0
let shortsCount = 0

src = src.replace(/https:\/\/youtu\.be\/([\w-]+)/g, (_, id) => {
  shortCount += 1
  return `https://www.youtube.com/watch?v=${id}`
})

src = src.replace(/https:\/\/youtube\.com\/shorts\//g, () => {
  shortsCount += 1
  return 'https://www.youtube.com/shorts/'
})

writeFileSync(FILE, src)
console.log(`Converted ${shortCount} youtu.be links -> watch?v=`)
console.log(`Converted ${shortsCount} shorts links -> www.youtube.com/shorts`)
console.log('Playlist URLs left unchanged.')
