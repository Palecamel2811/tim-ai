/**
 * timProfile.js — TIM's local memory of who you are.
 * All data stays on device. Never sent to a server unless
 * explicitly called by the synthesis API (with user awareness).
 */

const STORAGE_KEY = 'tim_profile'

export function getProfile() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
}

export function saveAnswer({ questionId, category, question, answer, hasVoice = false, mood = null }) {
  const existing = getProfile()
  const idx = existing.findIndex(a => a.questionId === questionId)
  const record = {
    questionId, category, question,
    answer: answer.trim(), hasVoice, mood,
    answeredAt: new Date().toISOString(),
  }
  if (idx >= 0) existing[idx] = record
  else existing.push(record)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  return existing
}

export function getAnswer(questionId) {
  return getProfile().find(a => a.questionId === questionId) || null
}

export function getProfileDepth() {
  return getProfile().length
}

export function getProfileCompletion() {
  return Math.min(100, Math.round((getProfileDepth() / 14) * 100))
}

/**
 * Returns a plain-text summary for injection into GPT-4o prompts.
 * Only call this when making an API request — the data briefly leaves
 * the device during the call.
 */
export function getProfileContext() {
  const answers = getProfile()
  if (answers.length === 0) return null
  return answers.map(a => `[${a.category}] ${a.question}\n→ ${a.answer}`).join('\n\n')
}

/**
 * A short music-conditioning string derived from the most emotionally
 * loaded profile answers. Injected directly into MusicGen prompts.
 */
export function getProfileSummaryForMusic() {
  const answers = getProfile()
  if (answers.length === 0) return ''
  const sonic   = answers.filter(a => a.category === 'sonic_memory').map(a => a.answer)
  const coping  = answers.filter(a => a.category === 'coping').map(a => a.answer)
  const goals   = answers.filter(a => a.category === 'goals_drive').map(a => a.answer)
  const parts   = []
  if (sonic.length)  parts.push(`sonic world: ${sonic[0].slice(0, 120)}`)
  if (coping.length) parts.push(`emotional state: ${coping[0].slice(0, 120)}`)
  if (goals.length)  parts.push(`inner drive: ${goals[0].slice(0, 120)}`)
  return parts.join(', ')
}

/** Wipe all profile data — right to deletion */
export function clearProfile() {
  localStorage.removeItem(STORAGE_KEY)
}

/** Export profile as JSON string for download */
export function exportProfile() {
  return JSON.stringify(getProfile(), null, 2)
}
