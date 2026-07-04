import { useState, useEffect, useRef } from 'react'
import { Mic, Square, Flame, ChevronDown, Check, BookOpen, Volume2 } from 'lucide-react'
import { getTodaysPrompt, getJournalStreak } from '../utils/journalPrompts'
import TIMVoice from '../components/TIMVoice'
import { getJournalDialogue } from '../utils/timPersonality'

const FREQUENCIES  = ['daily', 'weekly', 'monthly']
const PROMPT_TYPES = [
  { id: 'daily',        label: "Today's Check-In" },
  { id: 'weekly',       label: 'Weekly Reflection' },
  { id: 'monthly',      label: 'Deep Dive' },
  { id: 'sonic_memory', label: 'Sonic Memory' },
]

const MOODS = [
  { id: 'open',     label: 'Open',     color: '#4AAE8C' },
  { id: 'heavy',    label: 'Heavy',    color: '#8078C8' },
  { id: 'grateful', label: 'Grateful', color: '#4A8FD9' },
  { id: 'stuck',    label: 'Stuck',    color: '#D95050' },
  { id: 'curious',  label: 'Curious',  color: '#5AA0D9' },
  { id: 'raw',      label: 'Raw',      color: '#C47A3A' },
]

export default function JournalScreen() {
  const [activePromptType, setActivePromptType]   = useState('daily')
  const [prompt, setPrompt]                       = useState('')
  const [entryText, setEntryText]                 = useState('')
  const [selectedMood, setSelectedMood]           = useState(null)
  const [recordingVoice, setRecordingVoice]       = useState(false)
  const [voiceBlobUrl, setVoiceBlobUrl]           = useState(null)
  const [voiceSeconds, setVoiceSeconds]           = useState(0)
  const [saved, setSaved]                         = useState(false)
  const [streak, setStreak]                       = useState(0)
  const [entries, setEntries]                     = useState([])
  const [showHistory, setShowHistory]             = useState(false)
  const [timLine, setTimLine]                     = useState('')
  const [frequency, setFrequency]                 = useState(
    localStorage.getItem('tim_journal_frequency') || 'daily'
  )
  const [showFreqPicker, setShowFreqPicker]       = useState(false)

  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])
  const timerRef         = useRef(null)

  useEffect(() => {
    setPrompt(getTodaysPrompt(activePromptType))
    setStreak(getJournalStreak())
    const stored = JSON.parse(localStorage.getItem('tim_journal_entries') || '[]')
    setEntries(stored)
    setSaved(false)
    setEntryText('')
    setSelectedMood(null)
    setVoiceBlobUrl(null)
    setTimLine(getJournalDialogue('prompt'))
  }, [activePromptType])

  async function startVoice() {
    chunksRef.current = []
    const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder
    recorder.ondataavailable = e => chunksRef.current.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setVoiceBlobUrl(URL.createObjectURL(blob))
      stream.getTracks().forEach(t => t.stop())
      clearInterval(timerRef.current)
    }
    recorder.start()
    setRecordingVoice(true)
    setVoiceSeconds(0)
    timerRef.current = setInterval(() => setVoiceSeconds(s => s + 1), 1000)
  }

  function stopVoice() {
    mediaRecorderRef.current?.stop()
    setRecordingVoice(false)
  }

  function saveEntry() {
    if (!entryText.trim() && !voiceBlobUrl) return

    const existing = JSON.parse(localStorage.getItem('tim_journal_entries') || '[]')
    const entry = {
      id:          Date.now(),
      promptType:  activePromptType,
      prompt,
      text:        entryText.trim(),
      mood:        selectedMood,
      hasVoice:    !!voiceBlobUrl,
      voiceBlobUrl: voiceBlobUrl || null,
      createdAt:   new Date().toISOString(),
      date:        new Date().toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
      }),
    }

    const updated = [entry, ...existing]
    localStorage.setItem('tim_journal_entries', JSON.stringify(updated))
    setEntries(updated)
    setStreak(getJournalStreak())
    setSaved(true)
    setTimLine(getJournalDialogue('saved'))

    setTimeout(() => {
      setEntryText('')
      setSelectedMood(null)
      setVoiceBlobUrl(null)
      setTimLine(getJournalDialogue('prompt'))
    }, 1800)
  }

  function setJournalFrequency(freq) {
    setFrequency(freq)
    localStorage.setItem('tim_journal_frequency', freq)
    setShowFreqPicker(false)
  }

  const fmt = s =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const canSave = (entryText.trim().length > 0 || voiceBlobUrl) && !saved

  return (
    <div className="flex-1 flex flex-col px-6 py-8 gap-6 max-w-2xl mx-auto w-full">

      {/* Top bar — streak + frequency */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-[#4A8FD9]" />
          <span className="text-[#4A8FD9] font-semibold text-sm">
            {streak} day{streak !== 1 ? 's' : ''}
          </span>
          <span className="text-[#8A9AB8] text-xs">streak</span>
        </div>

        {/* Frequency picker */}
        <div className="relative">
          <button
            onClick={() => setShowFreqPicker(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#C8D4EC]
                       rounded-full text-xs text-[#5A6A8A] hover:border-[#6A9FD8]
                       hover:text-[#1A2038] transition-all"
          >
            <BookOpen size={12} />
            {frequency.charAt(0).toUpperCase() + frequency.slice(1)} check-ins
            <ChevronDown size={12} />
          </button>
          {showFreqPicker && (
            <div className="absolute right-0 top-9 bg-white border border-[#C8D4EC]
                            rounded-xl overflow-hidden z-10 min-w-36 shadow-lg shadow-[#C8D4EC]/40">
              {FREQUENCIES.map(f => (
                <button
                  key={f}
                  onClick={() => setJournalFrequency(f)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                    ${frequency === f
                      ? 'text-[#4A8FD9] bg-[#D6E8F8]'
                      : 'text-[#5A6A8A] hover:bg-[#E4EAF6] hover:text-[#1A2038]'
                    }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Prompt type tabs — no emojis */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {PROMPT_TYPES.map(pt => (
          <button
            key={pt.id}
            onClick={() => setActivePromptType(pt.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                        whitespace-nowrap transition-all duration-200 shrink-0 font-medium
                        ${activePromptType === pt.id
                          ? 'bg-[#4A8FD9] text-white'
                          : 'bg-white border border-[#C8D4EC] text-[#5A6A8A] hover:border-[#6A9FD8] hover:text-[#1A2038]'
                        }`}
          >
            {pt.label}
          </button>
        ))}
      </div>

      {/* The prompt card */}
      <div className="bg-white border border-[#C8D4EC] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[#8A9AB8] text-xs uppercase tracking-widest">
            {timLine || 'TIM asks'}
          </p>
        </div>
        <p className="text-[#1A2038] text-lg leading-relaxed italic">
          "{prompt}"
        </p>
      </div>

      {/* Mood selector */}
      <div>
        <p className="text-[#8A9AB8] text-xs uppercase tracking-widest mb-3">
          How are you feeling right now?
        </p>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map(mood => (
            <button
              key={mood.id}
              onClick={() => setSelectedMood(m => m?.id === mood.id ? null : mood)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
                ${selectedMood?.id === mood.id
                  ? 'border-transparent text-white'
                  : 'border-[#C8D4EC] text-[#5A6A8A] bg-white hover:border-[#6A9FD8]'
                }`}
              style={selectedMood?.id === mood.id ? { backgroundColor: mood.color } : {}}
            >
              {mood.label}
            </button>
          ))}
        </div>
      </div>

      {/* Write it */}
      <div className="flex flex-col gap-2">
        <p className="text-[#8A9AB8] text-xs uppercase tracking-widest">Write it out</p>
        <textarea
          value={entryText}
          onChange={e => setEntryText(e.target.value)}
          rows={5}
          placeholder="Don't think. Don't edit. Just let it come out."
          className="w-full bg-[#EEF2FA] border border-[#C8D4EC] rounded-xl p-4
                     text-[#1A2038] text-sm placeholder:text-[#8A9AB8] leading-relaxed
                     focus:outline-none focus:border-[#6A9FD8] resize-none transition-colors"
        />
        {entryText.length > 0 && (
          <p className="text-[#8A9AB8] text-xs text-right">{entryText.length} characters</p>
        )}
      </div>

      {/* Or speak it */}
      <div className="flex flex-col gap-3">
        <p className="text-[#8A9AB8] text-xs uppercase tracking-widest">Or speak it</p>
        <div className="flex items-center gap-4">
          <button
            onClick={recordingVoice ? stopVoice : startVoice}
            className={`w-14 h-14 rounded-full flex items-center justify-center
                        transition-all duration-200
              ${recordingVoice
                ? 'bg-[#D95050] scale-110 mic-recording'
                : 'bg-white border border-[#C8D4EC] hover:border-[#6A9FD8] knob'
              }`}
          >
            {recordingVoice
              ? <Square size={18} className="text-white" />
              : <Mic size={18} className="text-[#4A8FD9]" />
            }
          </button>

          {recordingVoice && (
            <div className="flex items-center gap-3">
              <div className="flex items-end gap-0.5 h-6">
                {Array.from({ length: 12 }, (_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-[#D95050] wave-bar"
                    style={{
                      height: `${30 + Math.random() * 70}%`,
                      animationDelay: `${i * 0.07}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-[#D95050] font-mono text-sm">{fmt(voiceSeconds)}</span>
            </div>
          )}

          {voiceBlobUrl && !recordingVoice && (
            <div className="flex items-center gap-3 flex-1">
              <Volume2 size={16} className="text-[#4A8FD9] shrink-0" />
              <audio controls src={voiceBlobUrl} className="flex-1 h-8" />
            </div>
          )}

          {!recordingVoice && !voiceBlobUrl && (
            <p className="text-[#8A9AB8] text-xs">
              Tap to record a voice note instead
            </p>
          )}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={saveEntry}
        disabled={!canSave}
        className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-medium
                    text-sm transition-all duration-300
                    ${saved
                      ? 'bg-[#4AAE8C]/15 border border-[#4AAE8C]/40 text-[#4AAE8C] save-burst'
                      : canSave
                      ? 'bg-[#4A8FD9] text-white hover:bg-[#3A7FC9] knob'
                      : 'bg-white border border-[#C8D4EC] text-[#8A9AB8] cursor-not-allowed'
                    }`}
      >
        {saved
          ? <><Check size={16} /> {getJournalDialogue('saved')}</>
          : 'Give this to TIM'
        }
      </button>

      {/* Past entries */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-2 text-[#8A9AB8] text-xs
                       hover:text-[#5A6A8A] transition-all"
          >
            <ChevronDown
              size={14}
              className={`transition-transform ${showHistory ? 'rotate-180' : ''}`}
            />
            {showHistory ? 'Hide' : 'Show'} past entries ({entries.length})
          </button>

          {showHistory && (
            <div className="flex flex-col gap-3">
              {entries.slice(0, 10).map(entry => (
                <div
                  key={entry.id}
                  className="bg-white border border-[#C8D4EC] rounded-xl p-4 flex flex-col gap-2
                             card-enter"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[#8A9AB8] text-xs">{entry.date}</span>
                      {entry.mood && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
                          style={{ backgroundColor: entry.mood.color }}
                        >
                          {entry.mood.label}
                        </span>
                      )}
                      {entry.hasVoice && (
                        <span className="text-[10px] bg-[#D6E8F8] text-[#4A8FD9]
                                         px-2 py-0.5 rounded-full border border-[#B8C8E0]">
                          Voice
                        </span>
                      )}
                    </div>
                    <span className="text-[#8A9AB8] text-[10px] uppercase tracking-wider">
                      {PROMPT_TYPES.find(p => p.id === entry.promptType)?.label}
                    </span>
                  </div>
                  <p className="text-[#8A9AB8] text-xs italic line-clamp-2">
                    "{entry.prompt}"
                  </p>
                  {entry.text && (
                    <p className="text-[#5A6A8A] text-sm leading-relaxed line-clamp-3">
                      {entry.text}
                    </p>
                  )}
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
