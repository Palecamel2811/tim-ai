import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Loader2, ChevronRight, RefreshCw, Brain } from 'lucide-react'
import { generateMusic } from '../utils/generateMusic'
import { getProfileContext, getProfileSummaryForMusic, getProfileDepth } from '../utils/timProfile'
import { getCreateDialogue, CREATE_STYLE_RESPONSES } from '../utils/timPersonality'
import TIMVoice from '../components/TIMVoice'

// No emojis — label only, clean and minimal
const STYLES = [
  { id: 'sunny',     label: 'Sunny',     desc: 'Bright, warm, feel-good'     },
  { id: 'gritty',    label: 'Gritty',    desc: 'Raw, dark, hard-hitting'     },
  { id: 'dreamy',    label: 'Dreamy',    desc: 'Floating, ethereal, ambient' },
  { id: 'bounce',    label: 'Bounce',    desc: 'Upbeat, rhythmic, energetic' },
  { id: 'cinematic', label: 'Cinematic', desc: 'Epic, sweeping, emotional'   },
  { id: 'coastal',   label: 'Coastal',   desc: 'Chill, breezy, laid-back'    },
]

export default function CreateScreen() {
  const [selectedStyle, setSelectedStyle] = useState(null)
  const [generating, setGenerating]       = useState(false)
  const [audioUrl, setAudioUrl]           = useState(null)
  const [error, setError]                 = useState(null)
  const [timLine, setTimLine]             = useState('')
  const [journalNote, setJournalNote]     = useState('')
  const [saving, setSaving]               = useState(false)

  const [brief, setBrief]               = useState(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const hasProfile = getProfileDepth() > 0

  const navigate     = useNavigate()
  const recordingUrl = sessionStorage.getItem('tim_recording_url')
  const notes        = JSON.parse(sessionStorage.getItem('tim_notes') || '[]')

  useEffect(() => {
    setTimLine(getCreateDialogue('idle'))
    if (hasProfile) fetchBrief()
  }, [])

  async function fetchBrief() {
    setBriefLoading(true)
    try {
      const profileContext = getProfileContext()
      if (!profileContext) return
      const res = await fetch('/api/synthesise', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ profileContext }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.brief) setBrief(data.brief)
      }
    } catch {
      // silent — never blocks generation
    } finally {
      setBriefLoading(false)
    }
  }

  function selectStyle(style) {
    setSelectedStyle(style)
    setTimLine(CREATE_STYLE_RESPONSES[style.id] || getCreateDialogue('idle'))
    setAudioUrl(null)
    setError(null)
  }

  async function generate() {
    if (!selectedStyle) return
    setGenerating(true)
    setAudioUrl(null)
    setError(null)
    setTimLine(getCreateDialogue('generating'))

    try {
      const humBlobUrl     = sessionStorage.getItem('tim_recording_url') || null
      const profileSummary = getProfileSummaryForMusic()
      const url = await generateMusic({
        notes,
        style:           selectedStyle.id,
        durationSeconds: 15,
        humBlobUrl,
        profileSummary,
      })
      setAudioUrl(url)
      setTimLine(getCreateDialogue('done'))
    } catch (err) {
      console.error(err)
      setError(err.message)
      setTimLine(getCreateDialogue('error'))
    } finally {
      setGenerating(false)
    }
  }

  function saveToMemory() {
    if (!journalNote.trim()) return
    setSaving(true)

    const existing  = JSON.parse(localStorage.getItem('tim_memories') || '[]')
    const newMemory = {
      id:        Date.now(),
      date:      new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      style:     selectedStyle,
      note:      journalNote.trim(),
      brief:     brief || null,
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
      <TIMVoice line={timLine} className="max-w-lg" />

      {/* Elder AI emotional brief */}
      {hasProfile && (
        <div className="w-full bg-white border border-[#C8D4EC] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={13} className="text-[#8078C8]" />
            <p className="text-[#8078C8] text-xs font-semibold uppercase tracking-widest">
              Elder AI knows you
            </p>
          </div>
          {briefLoading ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[#E4EAF6] rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-[#8078C8]/40 rounded-full tim-thinking-ring" />
              </div>
              <span className="text-[#8A9AB8] text-xs whitespace-nowrap">synthesising…</span>
            </div>
          ) : brief ? (
            <p className="text-[#5A6A8A] text-sm leading-relaxed italic">{brief}</p>
          ) : (
            <p className="text-[#8A9AB8] text-xs italic">
              Answer more Elder AI questions to unlock your emotional brief.
            </p>
          )}
        </div>
      )}

      {/* Detected notes */}
      {notes.length > 0 && (
        <div className="w-full bg-white border border-[#C8D4EC] rounded-2xl p-4">
          <p className="text-[#8A9AB8] text-xs mb-2 uppercase tracking-widest">
            Notes TIM detected in your hum
          </p>
          <div className="flex flex-wrap gap-2">
            {[...new Set(notes.map(n => n.note))].map((n, i) => (
              <span key={i}
                className="text-sm bg-[#D6E8F8] text-[#4A8FD9] px-3 py-1
                           rounded-full font-mono border border-[#B8C8E0]">
                {n}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recording playback */}
      {recordingUrl && (
        <div className="w-full bg-white border border-[#C8D4EC] rounded-2xl p-4">
          <p className="text-[#8A9AB8] text-xs mb-2 uppercase tracking-widest">Your hum</p>
          <audio controls src={recordingUrl} className="w-full h-9" />
        </div>
      )}

      {/* Style selector — label only, no emojis */}
      <div className="w-full">
        <p className="text-[#8A9AB8] text-xs uppercase tracking-widest mb-3">Choose a vibe</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {STYLES.map(style => (
            <button
              key={style.id}
              onClick={() => selectStyle(style)}
              className={`
                flex flex-col items-start gap-1 px-4 py-3.5 rounded-2xl border
                transition-all duration-200 text-left
                ${selectedStyle?.id === style.id
                  ? 'border-[#4A8FD9] bg-[#D6E8F8]'
                  : 'border-[#C8D4EC] bg-white hover:border-[#6A9FD8] hover:bg-[#E4EAF6]'
                }
              `}
            >
              <span className={`font-semibold text-sm
                ${selectedStyle?.id === style.id ? 'text-[#4A8FD9]' : 'text-[#1A2038]'}`}>
                {style.label}
              </span>
              <span className="text-[#8A9AB8] text-xs">{style.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      {selectedStyle && !audioUrl && (
        <div className="relative flex items-center justify-center">
          {generating && (
            <div className="absolute w-14 h-14 rounded-full border border-[#4A8FD9]/30
                            tim-thinking-ring pointer-events-none" />
          )}
          <button
            onClick={generate}
            disabled={generating}
            className="flex items-center gap-2 px-8 py-3 bg-[#4A8FD9] text-white
                       font-medium rounded-full hover:bg-[#3A7FC9] transition-all
                       disabled:opacity-50 knob"
          >
            {generating
              ? <><Loader2 size={18} className="animate-spin" /> TIM is building…</>
              : <><Play size={18} /> Let TIM build this</>
            }
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-4
                        flex items-center justify-between">
          <p className="text-red-500 text-sm">{error}</p>
          <button onClick={generate}
            className="text-[#4A8FD9] text-sm flex items-center gap-1 hover:opacity-70">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Generated audio + journal */}
      {audioUrl && (
        <div className="w-full bg-white border border-[#6A9FD8] rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#4A8FD9] font-semibold">{selectedStyle.label} — generated</p>
              <p className="text-[#8A9AB8] text-xs">{new Date().toLocaleDateString()}</p>
            </div>
            <button onClick={generate}
              className="text-[#8A9AB8] hover:text-[#5A6A8A] transition-all"
              title="Regenerate">
              <RefreshCw size={16} />
            </button>
          </div>

          <audio controls src={audioUrl} className="w-full" />

          <div className="flex flex-col gap-2">
            <label className="text-[#8A9AB8] text-xs uppercase tracking-widest">
              What does this remind you of?
            </label>
            <textarea
              value={journalNote}
              onChange={e => setJournalNote(e.target.value)}
              rows={3}
              placeholder="A memory, a place, a feeling… anything."
              className="w-full bg-[#EEF2FA] border border-[#C8D4EC] rounded-xl p-3
                         text-[#1A2038] text-sm placeholder:text-[#8A9AB8]
                         focus:outline-none focus:border-[#6A9FD8] resize-none transition-colors"
            />
          </div>

          <button
            onClick={saveToMemory}
            disabled={!journalNote.trim() || saving}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#4A8FD9] text-white
                       font-medium rounded-full hover:bg-[#3A7FC9] transition-all
                       disabled:opacity-30 disabled:cursor-not-allowed knob"
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
