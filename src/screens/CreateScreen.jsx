import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Loader2, ChevronRight, RefreshCw } from 'lucide-react'
import { generateMusic } from '../utils/generateMusic'

const STYLES = [
  { id: 'sunny',     emoji: '☀️', label: 'Sunny',     desc: 'Bright, warm, feel-good'       },
  { id: 'gritty',    emoji: '🌑', label: 'Gritty',    desc: 'Raw, dark, hard-hitting'       },
  { id: 'dreamy',    emoji: '🌊', label: 'Dreamy',    desc: 'Floating, ethereal, ambient'   },
  { id: 'bounce',    emoji: '🏀', label: 'Bounce',    desc: 'Upbeat, rhythmic, energetic'   },
  { id: 'cinematic', emoji: '🎬', label: 'Cinematic', desc: 'Epic, sweeping, emotional'     },
  { id: 'coastal',   emoji: '🌅', label: 'Coastal',   desc: 'Chill, breezy, laid-back'      },
]

const TIM_RESPONSES = {
  sunny:     "That light in your hum — I'm gonna build something that feels like a Saturday morning.",
  gritty:    "I feel that tension. Let me give it some weight.",
  dreamy:    "Close your eyes. This one's gonna drift.",
  bounce:    "That rhythm's got something. I'm locking it in.",
  cinematic: "Big. I hear something big here. Give me a moment.",
  coastal:   "Easy like that breeze. I got you.",
}

export default function CreateScreen() {
  const [selectedStyle, setSelectedStyle] = useState(null)
  const [generating, setGenerating]       = useState(false)
  const [audioUrl, setAudioUrl]           = useState(null)
  const [error, setError]                 = useState(null)
  const [timMessage, setTimMessage]       = useState("Pick a vibe — I'll build around what you gave me.")
  const [journalNote, setJournalNote]     = useState('')
  const [saving, setSaving]               = useState(false)
  const navigate = useNavigate()

  const recordingUrl = sessionStorage.getItem('tim_recording_url')
  const notes        = JSON.parse(sessionStorage.getItem('tim_notes') || '[]')

  function selectStyle(style) {
    setSelectedStyle(style)
    setTimMessage(TIM_RESPONSES[style.id])
    setAudioUrl(null)
    setError(null)
  }

  async function generate() {
    if (!selectedStyle) return
    setGenerating(true)
    setAudioUrl(null)
    setError(null)
    setTimMessage("Give me a sec… I'm building something from what you gave me.")

    try {
      const url = await generateMusic({ notes, style: selectedStyle.id, durationSeconds: 15 })
      setAudioUrl(url)
      setTimMessage("Here's what I heard in you. What does this remind you of?")
    } catch (err) {
      console.error(err)
      setError(err.message)
      setTimMessage("Something went wrong. Want to try again?")
    } finally {
      setGenerating(false)
    }
  }

  function saveToMemory() {
    if (!journalNote.trim()) return
    setSaving(true)

    const existing   = JSON.parse(localStorage.getItem('tim_memories') || '[]')
    const newMemory  = {
      id:        Date.now(),
      date:      new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      style:     selectedStyle,
      note:      journalNote.trim(),
      audioUrl:  audioUrl || null,
      notes:     notes.slice(0, 10),
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('tim_memories', JSON.stringify([newMemory, ...existing]))

    setTimeout(() => {
      setSaving(false)
      navigate('/memories')
    }, 600)
  }

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-10 gap-8 max-w-2xl mx-auto w-full">

      {/* TIM's voice */}
      <p className="text-[#F5E6C8] text-lg text-center opacity-80 italic transition-all duration-500">
        "{timMessage}"
      </p>

      {/* Detected notes summary */}
      {notes.length > 0 && (
        <div className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4">
          <p className="text-[#F5E6C8] text-xs opacity-50 mb-2 uppercase tracking-widest">Notes TIM detected in your hum</p>
          <div className="flex flex-wrap gap-2">
            {[...new Set(notes.map(n => n.note))].map((n, i) => (
              <span key={i} className="text-sm bg-[#F5C842]/20 text-[#F5C842] px-3 py-1 rounded-full font-mono">
                {n}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recording playback */}
      {recordingUrl && (
        <div className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4">
          <p className="text-[#F5E6C8] text-xs opacity-50 mb-2 uppercase tracking-widest">Your hum</p>
          <audio controls src={recordingUrl} className="w-full h-9" />
        </div>
      )}

      {/* Style selector */}
      <div className="w-full">
        <p className="text-[#F5E6C8] text-xs opacity-50 uppercase tracking-widest mb-3">Choose a vibe</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {STYLES.map(style => (
            <button
              key={style.id}
              onClick={() => selectStyle(style)}
              className={`
                flex flex-col items-start gap-1 p-4 rounded-2xl border transition-all duration-200 text-left
                ${selectedStyle?.id === style.id
                  ? 'border-[#F5C842] bg-[#F5C842]/10'
                  : 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#F5C842]/40'
                }
              `}
            >
              <span className="text-2xl">{style.emoji}</span>
              <span className="text-[#F5E6C8] font-semibold text-sm">{style.label}</span>
              <span className="text-[#F5E6C8] text-xs opacity-40">{style.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      {selectedStyle && !audioUrl && (
        <button
          onClick={generate}
          disabled={generating}
          className="flex items-center gap-2 px-8 py-3 bg-[#F5C842] text-[#0D0D0D]
                     font-semibold rounded-full hover:bg-yellow-300 transition-all disabled:opacity-60"
        >
          {generating
            ? <><Loader2 size={18} className="animate-spin" /> TIM is building…</>
            : <><Play size={18} /> Let TIM build this</>
          }
        </button>
      )}

      {/* Error state */}
      {error && (
        <div className="w-full bg-red-900/20 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={generate} className="text-[#F5C842] text-sm flex items-center gap-1 hover:opacity-80">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Generated audio + journal */}
      {audioUrl && (
        <div className="w-full bg-[#1A1A1A] border border-[#F5C842]/30 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedStyle.emoji}</span>
              <div>
                <p className="text-[#F5C842] font-semibold">{selectedStyle.label} — generated</p>
                <p className="text-[#F5E6C8] text-xs opacity-40">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <button
              onClick={generate}
              className="text-[#F5E6C8] opacity-40 hover:opacity-80 transition-all"
              title="Regenerate"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Real audio player */}
          <audio controls src={audioUrl} className="w-full" />

          {/* Journal prompt */}
          <div className="flex flex-col gap-2">
            <label className="text-[#F5E6C8] text-xs opacity-60 uppercase tracking-widest">
              What does this remind you of?
            </label>
            <textarea
              value={journalNote}
              onChange={e => setJournalNote(e.target.value)}
              rows={3}
              placeholder="A memory, a place, a feeling… anything."
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl p-3
                         text-[#F5E6C8] text-sm placeholder:opacity-30
                         focus:outline-none focus:border-[#F5C842]/50 resize-none"
            />
          </div>

          <button
            onClick={saveToMemory}
            disabled={!journalNote.trim() || saving}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#F5C842] text-[#0D0D0D]
                       font-semibold rounded-full hover:bg-yellow-300 transition-all
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {saving
              ? <><Loader2 size={16} className="animate-spin" /> Saving to memory…</>
              : <><ChevronRight size={16} /> Save to TIM's memory</>
            }
          </button>
        </div>
      )}
    </div>
  )
}
