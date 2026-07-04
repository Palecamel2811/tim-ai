import { useState, useEffect, useRef } from 'react'
import { Mic, Square, Flame, ChevronDown, Check, BookOpen, Volume2 } from 'lucide-react'
import { getTodaysPrompt, getJournalStreak } from '../utils/journalPrompts'

const FREQUENCIES  = ['daily', 'weekly', 'monthly']
const PROMPT_TYPES = [
  { id: 'daily',        label: "Today's Check-In",   emoji: '🌅' },
  { id: 'weekly',       label: 'Weekly Reflection',  emoji: '🌿' },
  { id: 'monthly',      label: 'Deep Dive',          emoji: '🌊' },
  { id: 'sonic_memory', label: 'Sonic Memory',       emoji: '🎧' },
]

const MOODS = [
  { id: 'open',     label: 'Open',     color: '#4ade80' },
  { id: 'heavy',    label: 'Heavy',    color: '#a78bfa' },
  { id: 'grateful', label: 'Grateful', color: '#F5C842' },
  { id: 'stuck',    label: 'Stuck',    color: '#f87171' },
  { id: 'curious',  label: 'Curious',  color: '#60a5fa' },
  { id: 'raw',      label: 'Raw',      color: '#fb923c' },
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
  }, [activePromptType])

  // Voice recording
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

    // Reset after brief celebration
    setTimeout(() => {
      setEntryText('')
      setSelectedMood(null)
      setVoiceBlobUrl(null)
    }, 1200)
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
          <Flame size={18} className="text-[#F5C842]" />
          <span className="text-[#F5C842] font-bold text-sm">
            {streak} day{streak !== 1 ? 's' : ''}
          </span>
          <span className="text-[#F5E6C8] text-xs opacity-40">streak</span>
        </div>

        {/* Frequency picker */}
        <div className="relative">
          <button
            onClick={() => setShowFreqPicker(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A]
                       rounded-full text-xs text-[#F5E6C8] opacity-60 hover:opacity-100 transition-all"
          >
            <BookOpen size={12} />
            {frequency.charAt(0).toUpperCase() + frequency.slice(1)} check-ins
            <ChevronDown size={12} />
          </button>
          {showFreqPicker && (
            <div className="absolute right-0 top-8 bg-[#1A1A1A] border border-[#2A2A2A]
                            rounded-xl overflow-hidden z-10 min-w-32 shadow-xl">
              {FREQUENCIES.map(f => (
                <button
                  key={f}
                  onClick={() => setJournalFrequency(f)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                    ${frequency === f
                      ? 'text-[#F5C842] bg-[#F5C842]/10'
                      : 'text-[#F5E6C8] opacity-60 hover:opacity-100 hover:bg-[#2A2A2A]'
                    }`}
                >
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
          <button
            key={pt.id}
            onClick={() => setActivePromptType(pt.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap
                        transition-all duration-200 shrink-0
                        ${activePromptType === pt.id
                          ? 'bg-[#F5C842] text-[#0D0D0D] font-semibold'
                          : 'bg-[#1A1A1A] border border-[#2A2A2A] text-[#F5E6C8] opacity-50 hover:opacity-100'
                        }`}
          >
            <span>{pt.emoji}</span>
            <span>{pt.label}</span>
          </button>
        ))}
      </div>

      {/* The prompt */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
        <p className="text-[#F5E6C8] text-xs opacity-40 uppercase tracking-widest mb-3">
          TIM asks
        </p>
        <p className="text-[#F5E6C8] text-lg leading-relaxed italic">
          "{prompt}"
        </p>
      </div>

      {/* Mood selector */}
      <div>
        <p className="text-[#F5E6C8] text-xs opacity-40 uppercase tracking-widest mb-3">
          How are you feeling right now?
        </p>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map(mood => (
            <button
              key={mood.id}
              onClick={() => setSelectedMood(m => m?.id === mood.id ? null : mood)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
                ${selectedMood?.id === mood.id
                  ? 'border-transparent text-[#0D0D0D]'
                  : 'border-[#2A2A2A] text-[#F5E6C8] opacity-50 hover:opacity-100'
                }`}
              style={selectedMood?.id === mood.id
                ? { backgroundColor: mood.color }
                : {}
              }
            >
              {mood.label}
            </button>
          ))}
        </div>
      </div>

      {/* Write it */}
      <div className="flex flex-col gap-2">
        <p className="text-[#F5E6C8] text-xs opacity-40 uppercase tracking-widest">
          Write it out
        </p>
        <textarea
          value={entryText}
          onChange={e => setEntryText(e.target.value)}
          rows={5}
          placeholder="Don't think. Don't edit. Just let it come out."
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4
                     text-[#F5E6C8] text-sm placeholder:opacity-20 leading-relaxed
                     focus:outline-none focus:border-[#F5C842]/40 resize-none transition-colors"
        />
        <p className="text-[#F5E6C8] text-xs opacity-20 text-right">
          {entryText.length > 0 ? `${entryText.length} characters` : ''}
        </p>
      </div>

      {/* Or speak it */}
      <div className="flex flex-col gap-3">
        <p className="text-[#F5E6C8] text-xs opacity-40 uppercase tracking-widest">
          Or speak it
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={recordingVoice ? stopVoice : startVoice}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200
              ${recordingVoice
                ? 'bg-red-500 hover:bg-red-400 scale-110'
                : 'bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#F5C842]/40'
              }`}
          >
            {recordingVoice
              ? <Square size={20} className="text-white" />
              : <Mic size={20} className="text-[#F5C842]" />
            }
          </button>

          {recordingVoice && (
            <div className="flex items-center gap-3">
              {/* Live pulse bars */}
              <div className="flex items-end gap-0.5 h-6">
                {Array.from({ length: 12 }, (_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-red-400 wave-bar"
                    style={{
                      height: `${30 + Math.random() * 70}%`,
                      animationDelay: `${i * 0.07}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-red-400 font-mono text-sm">{fmt(voiceSeconds)}</span>
            </div>
          )}

          {voiceBlobUrl && !recordingVoice && (
            <div className="flex items-center gap-3 flex-1">
              <Volume2 size={16} className="text-[#F5C842] shrink-0" />
              <audio controls src={voiceBlobUrl} className="flex-1 h-8" />
            </div>
          )}

          {!recordingVoice && !voiceBlobUrl && (
            <p className="text-[#F5E6C8] text-xs opacity-30">
              Tap to record a voice note instead
            </p>
          )}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={saveEntry}
        disabled={!canSave}
        className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-semibold
                    text-sm transition-all duration-300
                    ${saved
                      ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                      : canSave
                      ? 'bg-[#F5C842] text-[#0D0D0D] hover:bg-yellow-300'
                      : 'bg-[#1A1A1A] border border-[#2A2A2A] text-[#F5E6C8] opacity-20 cursor-not-allowed'
                    }`}
      >
        {saved
          ? <><Check size={16} /> TIM received that. Thank you.</>
          : 'Give this to TIM'
        }
      </button>

      {/* Past entries */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-2 text-[#F5E6C8] text-xs opacity-40
                       hover:opacity-70 transition-all"
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
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[#F5E6C8] text-xs opacity-40">{entry.date}</span>
                      {entry.mood && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: entry.mood.color + '30',
                            color: entry.mood.color,
                          }}
                        >
                          {entry.mood.label}
                        </span>
                      )}
                      {entry.hasVoice && (
                        <span className="text-[10px] bg-[#F5C842]/10 text-[#F5C842] px-2 py-0.5 rounded-full">
                          Voice
                        </span>
                      )}
                    </div>
                    <span className="text-[#F5E6C8] text-[10px] opacity-30 uppercase tracking-wider">
                      {PROMPT_TYPES.find(p => p.id === entry.promptType)?.emoji}
                    </span>
                  </div>
                  <p className="text-[#F5E6C8] text-xs opacity-50 italic line-clamp-2">
                    "{entry.prompt}"
                  </p>
                  {entry.text && (
                    <p className="text-[#F5E6C8] text-sm opacity-70 leading-relaxed line-clamp-3">
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
