import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Loader2, ChevronRight } from 'lucide-react'

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
  const [generated, setGenerated]         = useState(false)
  const [timMessage, setTimMessage]       = useState("Pick a vibe — I'll build around what you gave me.")
  const [journalNote, setJournalNote]     = useState('')
  const [saving, setSaving]               = useState(false)
  const navigate = useNavigate()

  const recordingUrl = sessionStorage.getItem('tim_recording_url')

  function selectStyle(style) {
    setSelectedStyle(style)
    setTimMessage(TIM_RESPONSES[style.id])
    setGenerated(false)
  }

  async function generate() {
    if (!selectedStyle) return
    setGenerating(true)
    setTimMessage(`${TIM_RESPONSES[selectedStyle.id]}`)

    // Simulate generation delay (will be replaced with real Replicate API call)
    await new Promise(r => setTimeout(r, 2800))

    setGenerating(false)
    setGenerated(true)
    setTimMessage("Here's what I heard in you. What does this remind you of?")
  }

  function saveToMemory() {
    if (!journalNote.trim()) return
    setSaving(true)

    const existing = JSON.parse(localStorage.getItem('tim_memories') || '[]')
    const newMemory = {
      id:        Date.now(),
      date:      new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      style:     selectedStyle,
      note:      journalNote.trim(),
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

      {/* Recording playback (if available) */}
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
      {selectedStyle && !generated && (
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

      {/* Generated output */}
      {generated && (
        <div className="w-full bg-[#1A1A1A] border border-[#F5C842]/30 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedStyle.emoji}</span>
            <div>
              <p className="text-[#F5C842] font-semibold">{selectedStyle.label} beat — generated</p>
              <p className="text-[#F5E6C8] text-xs opacity-40">Based on your hum · {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Placeholder waveform for the generated track */}
          <div className="flex items-center gap-1 h-10">
            {Array.from({ length: 48 }, (_, i) => (
              <div
                key={i}
                className="flex-1 rounded-full bg-[#F5C842]"
                style={{ height: `${20 + Math.sin(i * 0.7) * 14 + Math.sin(i * 1.3) * 10}%`, opacity: 0.7 }}
              />
            ))}
          </div>

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
