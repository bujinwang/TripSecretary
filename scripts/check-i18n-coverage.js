const fs = require('fs')
const path = require('path')

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const en = readJson(path.resolve(__dirname, '../app/i18n/translations/countries.en.json'))
const zh = readJson(path.resolve(__dirname, '../app/i18n/translations/countries.zh.json'))

const countries = ['th', 'sg', 'hk', 'my', 'tw', 'kr', 'jp', 'usa', 'vn', 'ca']

const get = (obj, keyPath) => keyPath.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj)

const required = {
  info: [
    'info.headerTitle',
    'info.title',
    'info.subtitle',
    'info.sections.visa.title',
    'info.sections.visa.items',
    'info.sections.onsite.title',
    'info.sections.onsite.items',
    'info.sections.appFeatures.title',
    'info.sections.appFeatures.items',
    'info.continueButton',
  ],
  entryFlow: [
    'entryFlow.title',
    'entryFlow.progress.headline.ready',
    'entryFlow.progress.headline.almost',
    'entryFlow.progress.headline.start',
    'entryFlow.progress.subtitle.ready',
    'entryFlow.progress.subtitle.almost',
    'entryFlow.progress.subtitle.start',
    'entryFlow.progress.label',
    'entryFlow.status.ready.title',
    'entryFlow.status.ready.subtitle',
    'entryFlow.status.mostlyComplete.title',
    'entryFlow.status.mostlyComplete.subtitle',
    'entryFlow.status.needsImprovement.title',
    'entryFlow.status.needsImprovement.subtitle',
    'entryFlow.countdown.title',
    'entryFlow.countdown.subtitle',
    'entryFlow.countdown.time',
    'entryFlow.countdown.arrival',
    'entryFlow.countdown.days',
    'entryFlow.actions.previewPack',
    'entryFlow.actions.previewPackSubtitle',
    'entryFlow.actions.entryGuide',
    'entryFlow.actions.entryGuideSubtitle',
    'entryFlow.actions.edit',
    'entryFlow.actions.editSubtitle',
    'entryFlow.actions.editThai',
    'entryFlow.actions.editThaiSubtitle',
    'entryFlow.actions.help.title',
    'entryFlow.actions.help.message',
    'entryFlow.actions.help.share',
    'entryFlow.actions.help.contact',
    'entryFlow.actions.help.callout',
    'entryFlow.actions.help.calloutSubtitle',
    'entryFlow.actions.continue',
    'entryFlow.actions.submit',
  ],
}

let missing = []

countries.forEach((c) => {
  Object.keys(required).forEach((section) => {
    required[section].forEach((r) => {
      const key = `${c}.${r}`
      if (get(en, key) === undefined) missing.push(`en:${key}`)
      if (get(zh, key) === undefined) missing.push(`zh:${key}`)
    })
  })
})

if (missing.length) {
  console.error('Missing i18n keys:', missing.slice(0, 100).join('\n'))
  process.exitCode = 1
} else {
  console.log('i18n coverage OK')
}