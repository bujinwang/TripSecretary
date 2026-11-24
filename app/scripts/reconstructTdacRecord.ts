import * as FileSystem from 'expo-file-system'
import TDACSubmissionService from '../services/thailand/TDACSubmissionService'

type TravelerInfo = Record<string, any>

export async function reconstructTdacRecord(arrCardNo: string, srcPath: string, travelerInfo: TravelerInfo, submissionMethod: 'api' | 'webview' | 'hybrid' = 'api'): Promise<{ pdfPath: string; result: any }> {
  const baseDir = FileSystem.documentDirectory
  if (!baseDir) {
    throw new Error('FileSystem.documentDirectory is not available')
  }
  const normalizedBase = baseDir.endsWith('/') ? baseDir : `${baseDir}/`
  const tdacDir = `${normalizedBase}tdac/`
  const exists = await FileSystem.getInfoAsync(tdacDir)
  if (!exists.exists) {
    await FileSystem.makeDirectoryAsync(tdacDir, { intermediates: true })
  }
  const filename = `TDAC_${arrCardNo}_${Date.now()}.pdf`
  const destPath = `${tdacDir}${filename}`
  await FileSystem.copyAsync({ from: srcPath, to: destPath })

  const payload = {
    arrCardNo,
    qrUri: destPath,
    pdfPath: destPath,
    submittedAt: new Date().toISOString(),
    submissionMethod,
    duration: null,
    travelerName: [travelerInfo.firstName, travelerInfo.familyName].filter(Boolean).join(' ').trim() || undefined,
    passportNo: travelerInfo.passportNo,
    arrivalDate: travelerInfo.arrivalDate
  }

  const result = await TDACSubmissionService.handleTDACSubmissionSuccess(payload as any, travelerInfo as any)
  return { pdfPath: destPath, result }
}
