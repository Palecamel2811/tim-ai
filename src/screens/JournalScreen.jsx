import { useState, useEffect, useRef } from 'react'
import { Mic, Square, Flame, ChevronDown, Check, BookOpen, Volume2, Sparkles } from 'lucide-react'
import { getTodaysPrompt, getJournalStreak } from '../utils/journalPrompts'
import TIMVoice from '../components/TIMVoice'
import { getJournalDialogue } from '../utils/timPersonality'
import { getProfileContext } from '../utils/timProfile'

const FREQUENCIES  = ['daily', 'weekly', 'monthly']
const PROMPT_TYPES = [
  { id: 'daily',        label: "Today's Check-In" },
  { id: 'weekly',       label: 'Weekly Reflection' },
  { id: 'monthly',      label: 'Deep Dive' },
  { id: 'sonic_memory', label: 'Sonic Memory' },
]

const MOODS = [
  { id: 'open',     label: 'Open',     color: '#4AAEA0' },
  { id: 'heavy',    label: 'Heavy',    color: '#8878D0' },
  { id: 'grateful', label: 'Grateful', color: '#7A9FD9' },
  { id: 'stuck',    label: 'Stuck',    color: '#E05870' },
  { id: 'curious',  label: 'Curious',  color: '#6A9FD9' },
  { id: 'raw',      label: 'Raw',      color: '#C47A3A' },
]

export default function JournalScreen() {
  const [activePromptType, setActivePromptType] = useState('daily')
  const [prompt, setPrompt]                     = useState('')
  const [entryText, setEntryText]               = useState('')
  const [selectedMood, setSelectedMood]         = useState(null)
  const [recordingVoice, setRecordingVoice]     = useState(false)
  const [voiceBlobUrl, setVoiceBlobUrl]         = useState(null)
  const [voiceSeconds, setVoiceSeconds]         = useState(0)
  const [saved, setSaved]                       = useState(false)
  const [streak, setStreak]                     = useState(0)
  const [entries, setEntries]                   = useState([])
  const [showHistory, setShowHistory]           = useState(false)
  const [timLine, setTimLine]                   = useState('')
  const [frequency, setFrequency]               = useState(
    localStorage.getItem('tim_journal_frequency') || 'daily'
  )
  const [showFreqPicker, setShowFreqPicker] = useState(false)

  // Lyrics generation
  const [generatingLyrics, setGeneratingLyrics] = useState(false)
  const [generatedLyrics, setGeneratedLyrics]   = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])
  const timerRef         = useRef(null)

  useEffect(() => {
    setPrompt(getTodaysPrompt(activePromptType))
    setStreak(getJournalStreak())
    const stored = JSON.parse(localStorage.getItem('tim_journal_entries') || '[]')
    setEntries(stored)
    setSaved(false); setEntryText(''); setSelectedMood(null); setVoiceBlobUrl(null)
    setGeneratedLyrics(null)
    setTimLine(getJournalDialogue('prompt'))
  }, [activePromptType])

  async function startVoice() {
    chunksRef.current = []
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder
    recorder.ondataavailable = e => chunksRef.current.push(e.data)
    recorder.onstop = () => {
      setVoiceBlobUrl(URL.createObjectURL(new Blob(chunksRef.current, { type: 'audio/webm' })))
      stream.getTracks().forEach(t => t.stop())
      clearInterval(timerRef.current)
    }
    recorder.start()
    setRecordingVoice(true)
    setVoiceSeconds(0)
    timerRef.current = setInterval(() => setVoiceSeconds(s => s + 1), 1000)
  }

  function stopVoice() { mediaRecorderRef.current?.stop(); setRecordingVoice(false) }

  function saveEntry() {
    if (!entryText.trim() && !voiceBlobUrl) return
    const existing = JSON.parse(localStorage.getItem('tim_journal_entries') || '[]')
    const entry = {
      id: Date.now(), promptType: activePromptType, prompt,
      text: entryText.trim(), mood: selectedMood, hasVoice: !!voiceBlobUrl,
      voiceBlobUrl: voiceBlobUrl || null, createdAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    }
    const updated = [entry, ...existing]
    localStorage.setItem('tim_journal_entries', JSON.stringify(updated))
    setEntries(updated)
    setStreak(getJournalStreak())
    setSaved(true)
    setTimLine(getJournalDialogue('saved'))
    setTimeout(() => {
      setEntryText(''); setSelectedMood(null); setVoiceBlobUrl(null)
      setTimLine(getJournalDialogue('prompt'))
    }, 1800)
  }

  /** Journal → Lyrics: send entry to GPT-4o through TIM's lens */
  async function generateLyrics() {
    if (!entryText.trim() || generatingLyrics) return
    setGeneratingLyrics(true)
    setGeneratedLyrics(null)
    try {
      const profileContext = getProfileContext()
      const res = await fetch('/api/synthesise', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          profileContext: profileContext || '',
          journalEntry:   entryText.trim(),
          mode:           'lyrics',
        }),
      })
      if (res.ok) {
        const d = await res.json()
        setGeneratedLyrics(d.brief || d.lyrics || null)
      }
    } catch { /* silent */ }
    finally { setGeneratingLyrics(false) }
  }

  const fmt = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`
  const canSave = (entryText.trim().length > 0 || voiceBlobUrl) && !saved

  return (
    <div className="flex-1 flex flex-col px-5 py-6 gap-5 max-w-2xl mx-auto w-full">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={15} className="text-[#B8C8E8]" />
          <span className="text-[#B8C8E8] font-medium text-sm">{streak} day{streak !== 1 ? 's' : ''}</span>
          <span className="text-[#6A7A9A] text-xs">streak</span>
        </div>
        <div className="relative">
          <button onClick={() => setShowFreqPicker(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#12192A] border border-[#2A3550]
                       rounded-full text-xs text-[#B8C8E8] hover:border-[#6A8AC8] transition-all">
            <BookOpen size={11} />
            {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
            <ChevronDown size={11} />
          </button>
          {showFreqPicker && (
            <div className="absolute right-0 top-9 bg-[#12192A] border border-[#2A3550]
                            rounded-xl overflow-hidden z-10 min-w-32 shadow-xl">
              {FREQUENCIES.map(f => (
                <button key={f} onClick={() => {
                  setFrequency(f)
                  localStorage.setItem('tim_journal_frequency', f)
                  setShowFreqPicker(false)
                }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                    ${frequency === f ? 'text-[#F0F4FF] bg-[#B8C8E8]/10' : 'text-[#6A7A9A] hover:bg-[#1A2235]'}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Prompt type tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {PROMPT_TYPES.map(pt => (
          <button key={pt.id} onClick={() => setActivePromptType(pt.id)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap font-medium
              transition-all duration-200 shrink-0
              ${activePromptType === pt.id
                ? 'bg-[#B8C8E8]/15 border border-[#B8C8E8]/30 text-[#F0F4FF]'
                : 'bg-[#12192A] border border-[#2A3550] text-[#6A7A9A] hover:border-[#6A8AC8]'
              }`}>
            {pt.label}
          </button>
        ))}
      </div>

      {/* Prompt card */}
      <div className="bg-[#12192A] border border-[#2A3550] rounded-2xl p-5">
        <p className="text-[#6A7A9A] text-xs uppercase tracking-widest mb-3">
          {timLine || 'TIM asks'}
        </p>
        <p className="text-[#F0F4FF] text-lg leading-relaxed italic">"{prompt}"</p>
      </div>

      {/* Mood */}
      <div>
        <p className="text-[#6A7A9A] text-xs uppercase tracking-widest mb-3">
          How are you feeling right now?
        </p>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map(mood => (
            <button key={mood.id}
              onClick={() => setSelectedMood(m => m?.id === mood.id ? null : mood)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
                ${selectedMood?.id === mood.id
                  ? 'border-transparent text-white'
                  : 'border-[#2A3550] text-[#6A7A9A] bg-[#12192A] hover:border-[#6A8AC8]'
                }`}
              style={selectedMood?.id === mood.id ? { backgroundColor: mood.color } : {}}>
              {mood.label}
            </button>
          ))}
        </div>
      </div>

      {/* Write */}
      <div className="flex flex-col gap-2">
        <p className="text-[#6A7A9A] text-xs uppercase tracking-widest">Write it out</p>
        <textarea value={entryText} onChange={e => setEntryText(e.target.value)} rows={5}
          placeholder="Don't think. Don't edit. Just let it come out."
          className="w-full bg-[#0A0E1A] border border-[#2A3550] rounded-xl p-4
                     text-[#F0F4FF] text-sm placeholder:text-[#3A4A6A] leading-relaxed
                     focus:outline-none focus:border-[#6A8AC8] resize-none transition-colors" />
        {entryText.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-[#3A4A6A] text-xs">{entryText.length} characters</p>
            {/* Journal → Lyrics button */}
            <button onClick={generateLyrics} disabled={generatingLyrics}
              className="flex items-center gap-1.5 text-xs text-[#8878D0] hover:text-[#B8A8F0]
                         transition-colors disabled:opacity-40">
              <Sparkles size={12} />
              {generatingLyrics ? 'TIM is writing…' : 'Turn this into lyrics'}
            </button>
          </div>
        )}
      </div>

      {/* Generated lyrics */}
      {generatedLyrics && (
        <div className="bg-[#1A1A35] border border-[#8878D0]/20 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-[#8878D0]" />
            <p className="text-[#8878D0] text-xs uppercase tracking-widest">TIM heard this in what you wrote</p>
          </div>
          <p className="text-[#F0F4FF] text-sm leading-relaxed whitespace-pre-line italic">
            {generatedLyrics}
          </p>
        </div>
      )}

      {/* Voice */}
      <div className="flex flex-col gap-3">
        <p className="text-[#6A7A9A] text-xs uppercase tracking-widest">Or speak it</p>
        <div className="flex items-center gap-4">
          <button onClick={recordingVoice ? stopVoice : startVoice}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200
              ${recordingVoice
                ? 'bg-[#E05870] scale-110 mic-recording'
                : 'bg-[#12192A] border border-[#2A3550] hover:border-[#6A8AC8] knob'
              }`}>
            {recordingVoice ? <Square size={18} className="text-white" /> : <Mic size={18} className="text-[#B8C8E8]" />}
          </button>
          {recordingVoice && (
            <div className="flex items-center gap-3">
              <div className="flex items-end gap-0.5 h-6">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="w-1 rounded-full bg-[#E05870] wave-bar"
                    style={{ height: `${30 + Math.random() * 70}%`, animationDelay: `${i * 0.07}s` }} />
                ))}
              </div>
              <span className="text-[#E05870] font-mono text-sm">{fmt(voiceSeconds)}</span>
            </div>
          )}
          {voiceBlobUrl && !recordingVoice && (
            <div className="flex items-center gap-3 flex-1">
              <Volume2 size={16} className="text-[#B8C8E8] shrink-0" />
              <audio controls src={voiceBlobUrl} className="flex-1 h-8" />
            </div>
          )}
          {!recordingVoice && !voiceBlobUrl && (
            <p className="text-[#3A4A6A] text-xs">Tap to record a voice note instead</p>
          )}
        </div>
      </div>

      {/* Save */}
      <button onClick={saveEntry} disabled={!canSave}
        className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-medium
          text-sm transition-all duration-300
          ${saved
            ? 'bg-[#4AAEA0]/15 border border-[#4AAEA0]/30 text-[#4AAEA0] save-burst'
            : canSave
            ? 'bg-[#B8C8E8]/10 border border-[#B8C8E8]/20 text-[#F0F4FF] hover:bg-[#B8C8E8]/20 knob'
            : 'bg-[#12192A] border border-[#2A3550] text-[#3A4A6A] cursor-not-allowed'
          }`}>
        {saved
          ? <><Check size={16} /> {getJournalDialogue('saved')}</>
          : 'Give this to TIM'
        }
      </button>

      {/* History */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-3">
          <button onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-2 text-[#6A7A9A] text-xs hover:text-[#B8C8E8] transition-all">
            <ChevronDown size={13} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
            {showHistory ? 'Hide' : 'Show'} past entries ({entries.length})
          </button>
          {showHistory && (
            <div className="flex flex-col gap-2">
              {entries.slice(0, 10).map(entry => (
                <div key={entry.id}
                  className="bg-[#12192A] border border-[#2A3550] rounded-xl p-4 flex flex-col gap-2 card-enter">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[#6A7A9A] text-xs">{entry.date}</span>
                      {entry.mood && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
                          style={{ backgroundColor: entry.mood.color }}>
                          {entry.mood.label}
                        </span>
                      )}
                      {entry.hasVoice && (
                        <span className="text-[10px] bg-[#B8C8E8]/10 text-[#B8C8E8] px-2 py-0.5
                                         rounded-full border border-[#2A3550]">Voice</span>
                      )}
                    </div>
                    <span className="text-[#3A4A6A] text-[10px]">
                      {PROMPT_TYPES.find(p => p.id === entry.promptType)?.label}
                    </span>
                  </div>
                  <p className="text-[#3A4A6A] text-xs italic line-clamp-2">"{entry.prompt}"</p>
                  {entry.text && <p className="text-[#6A7A9A] text-sm leading-relaxed line-clamp-3">{entry.text}</p>}
                  {entry.hasVoice && entry.voiceBlobUrl && (
                    <audio controls src={entry.voiceBlobUrl} className="w-full h-8 mt-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
