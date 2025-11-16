import fs from 'fs'
import path from 'path'

const readJson = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'))

const enPath = path.resolve(__dirname, '../../translations/countries.en.json')
const zhPath = path.resolve(__dirname, '../../translations/countries.zh.json')

const en = readJson(enPath)
const zh = readJson(zhPath)

const countries = ['th', 'sg', 'hk', 'my', 'tw', 'kr', 'jp', 'usa', 'vn', 'ca']

const get = (obj: any, keyPath: string) => {
  return keyPath.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj)
}

describe('i18n coverage (en & zh)', () => {
  test('Info screen keys exist', () => {
    const required = [
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
    ]
    countries.forEach((c) => {
      required.forEach((r) => {
        const key = `${c}.${r}`
        expect(get(en, key)).toBeDefined()
        expect(get(zh, key)).toBeDefined()
      })
    })
  })

  test('Entry Flow keys exist', () => {
    const required = [
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
    ]
    countries.forEach((c) => {
      required.forEach((r) => {
        const key = `${c}.${r}`
        expect(get(en, key)).toBeDefined()
        expect(get(zh, key)).toBeDefined()
      })
    })
  })
})