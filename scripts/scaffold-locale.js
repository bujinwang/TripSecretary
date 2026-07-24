const fs = require('fs')
const path = require('path')

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const writeJson = (p, obj) => fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8')

const deepMergeMissing = (base, target) => {
  if (Array.isArray(base)) return Array.isArray(target) ? target : base
  if (typeof base !== 'object' || base === null) return target === undefined ? base : target
  const out = { ...(typeof target === 'object' && target ? target : {}) }
  for (const k of Object.keys(base)) {
    out[k] = deepMergeMissing(base[k], out[k])
  }
  return out
}

const root = path.resolve(__dirname, '../app/i18n/translations')
const enPath = path.join(root, 'countries.en.json')
const en = readJson(enPath)

const targets = ['fr', 'de', 'es', 'ms', 'ko', 'ja', 'vi', 'th']

for (const lang of targets) {
  const file = path.join(root, `countries.${lang}.json`)
  let current = {}
  if (fs.existsSync(file)) {
    try { current = readJson(file) } catch (e) { current = {} }
  }
  const merged = deepMergeMissing(en, current)
  writeJson(file, merged)
  console.log(`Scaffolded ${lang}: ${file}`)
}