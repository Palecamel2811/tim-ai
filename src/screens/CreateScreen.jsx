import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Loader2, ChevronRight, RefreshCw, Brain } from 'lucide-react'
import { generateMusic } from '../utils/generateMusic'
import { getProfileContext, getProfileSummaryForMusic, getProfileDepth } from '../utils/timProfile'
import { getCreateDialogue, CREATE_STYLE_RESPONSES } from '../utils/timPersonality'
import TIMSphere from '../components/TIMSphere'
import TIMVoice from '../components/TIMVoice'

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
  const [sphereState, setSphereState]     = useState('idle')
  const [journalNote, setJournalNote]     = useState('')
  const [saving, setSaving]               = useState(false)
  const [brief, setBrief]                 = useState(null)
  const [briefLoading, setBriefLoading]   = useState(false)
  const hasProfile = getProfileDepth() > 0
  const navigate   = useNavigate()
  const recordingUrl = sessionStorage.getItem('tim_recording_url')
  const notes        = JSON.parse(sessionStorage.getItem('tim_notes') || '[]')

  useEffect(() => {
    setTimLine(getCreateDialogue('idle'))
    if (hasProfile) fetchBrief()
  }, [])

  async function fetchBrief() {
    setBriefLoading(true)
    try {
      const ctx = getProfileContext()
      if (!ctx) return
      const res = await fetch('/api/synthesise', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileContext: ctx }),
      })
      if (res.ok) {
        const d = await res.json()
        if (d.brief) setBrief(d.brief)
      }
    } catch { /* silent */ }
    finally { setBriefLoading(false) }
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
    setSphereState('thinking')
    setAudioUrl(null)
    setError(null)
    setTimLine(getCreateDialogue('generating'))
    try {
      const url = await generateMusic({
        notes, style: selectedStyle.id, durationSeconds: 15,
        humBlobUrl: sessionStorage.getItem('tim_recording_url') || null,
        profileSummary: getProfileSummaryForMusic(),
      })
      setAudioUrl(url)
      setTimLine(getCreateDialogue('done'))
      setSphereState('idle')
    } catch (err) {
      setError(err.message)
      setTimLine(getCreateDialogue('error'))
      setSphereState('idle')
    } finally { setGenerating(false) }
  }

  function saveToMemory() {
    if (!journalNote.trim()) return
    setSaving(true)
    const existing = JSON.parse(localStorage.getItem('tim_memories') || '[]')
    localStorage.setItem('tim_memories', JSON.stringify([{
      id: Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      style: selectedStyle, note: journalNote.trim(), brief: brief || null,
      audioUrl: audioUrl || null, notes: notes.slice(0, 10),
      createdAt: new Date().toISOString(),
    }, ...existing]))
    setTimeout(() => { setSaving(false); navigate('/memories') }, 600)
  }

  return (
    <div className="flex-1 flex flex-col items-center px-5 py-6 gap-6 max-w-2xl mx-auto w-full">

      {/* Sphere — smaller, thinking state during generation */}
      <TIMSphere state={sphereState} size={100} />
      <TIMVoice line={timLine} className="max-w-lg" />

      {/* Elder AI brief */}
      {hasProfile && (
        <div className="w-full bg-[#12192A] border border-[#2A2050] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={12} className="text-[#8878D0]" />
            <p className="text-[#8878D0] text-xs font-medium uppercase tracking-widest">
              Elder AI knows you
            </p>
          </div>
          {briefLoading
            ? <div className="h-1 bg-[#2A2050] rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-[#8878D0]/40 rounded-full tim-thinking-ring" />
              </div>
            : brief
            ? <p className="text-[#6A7A9A] text-sm leading-relaxed italic">{brief}</p>
            : <p className="text-[#3A4A6A] text-xs italic">Answer Elder AI questions to unlock your emotional brief.</p>
          }
        </div>
      )}

      {/* Detected notes */}
      {notes.length > 0 && (
        <div className="w-full bg-[#12192A] border border-[#2A3550] rounded-2xl p-4">
          <p className="text-[#6A7A9A] text-xs mb-2 uppercase tracking-widest">Notes TIM detected</p>
          <div className="flex flex-wrap gap-2">
            {[...new Set(notes.map(n => n.note))].map((n, i) => (
              <span key={i} className="text-sm bg-[#B8C8E8]/10 text-[#B8C8E8] px-3 py-1
                                       rounded-full font-mono border border-[#2A3550]">{n}</span>
            ))}
          </div>
        </div>
      )}

      {recordingUrl && (
        <div className="w-full bg-[#12192A] border border-[#2A3550] rounded-2xl p-4">
          <p className="text-[#6A7A9A] text-xs mb-2 uppercase tracking-widest">Your hum</p>
          <audio controls src={recordingUrl} className="w-full h-9" />
        </div>
      )}

      {/* Style selector */}
      <div className="w-full">
        <p className="text-[#6A7A9A] text-xs uppercase tracking-widest mb-3">Choose a vibe</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {STYLES.map(style => (
            <button key={style.id} onClick={() => selectStyle(style)}
              className={`flex flex-col items-start gap-1 px-4 py-3 rounded-2xl border
                transition-all duration-200 text-left
                ${selectedStyle?.id === style.id
                  ? 'border-[#B8C8E8]/40 bg-[#B8C8E8]/10'
                  : 'border-[#2A3550] bg-[#12192A] hover:border-[#B8C8E8]/20'
                }`}>
              <span className={`font-medium text-sm
                ${selectedStyle?.id === style.id ? 'text-[#F0F4FF]' : 'text-[#B8C8E8]'}`}>
                {style.label}
              </span>
              <span className="text-[#6A7A9A] text-xs">{style.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generate */}
      {selectedStyle && !audioUrl && (
        <div className="relative flex items-center justify-center">
          {generating && (
            <div className="absolute w-14 h-14 rounded-full border border-[#B8C8E8]/20 tim-thinking-ring pointer-events-none" />
          )}
          <button onClick={generate} disabled={generating}
            className="flex items-center gap-2 px-8 py-3 bg-[#B8C8E8]/10 border border-[#B8C8E8]/20
                       text-[#F0F4FF] font-medium rounded-full hover:bg-[#B8C8E8]/20 transition-all
                       disabled:opacity-40 knob">
            {generating
              ? <><Loader2 size={18} className="animate-spin" /> TIM is building…</>
              : <><Play size={18} /> Let TIM build this</>
            }
          </button>
        </div>
      )}

      {error && (
        <div className="w-full bg-[#E05870]/10 border border-[#E05870]/20 rounded-2xl p-4
                        flex items-center justify-between">
          <p className="text-[#E05870] text-sm">{error}</p>
          <button onClick={generate} className="text-[#B8C8E8] text-sm flex items-center gap-1 hover:opacity-70">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {audioUrl && (
        <div className="w-full bg-[#12192A] border border-[#B8C8E8]/20 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#F0F4FF] font-medium">{selectedStyle.label} — generated</p>
              <p className="text-[#6A7A9A] text-xs">{new Date().toLocaleDateString()}</p>
            </div>
            <button onClick={generate} className="text-[#3A4A6A] hover:text-[#6A7A9A] transition-all">
              <RefreshCw size={16} />
            </button>
          </div>
          <audio controls src={audioUrl} className="w-full" />
          <div className="flex flex-col gap-2">
            <label className="text-[#6A7A9A] text-xs uppercase tracking-widest">
              What does this remind you of?
            </label>
            <textarea value={journalNote} onChange={e => setJournalNote(e.target.value)} rows={3}
              placeholder="A memory, a place, a feeling… anything."
              className="w-full bg-[#0A0E1A] border border-[#2A3550] rounded-xl p-3
                         text-[#F0F4FF] text-sm placeholder:text-[#3A4A6A]
                         focus:outline-none focus:border-[#6A8AC8] resize-none transition-colors" />
          </div>
          <button onClick={saveToMemory} disabled={!journalNote.trim() || saving}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#B8C8E8]/10 border border-[#B8C8E8]/20
                       text-[#F0F4FF] font-medium rounded-full hover:bg-[#B8C8E8]/20 transition-all
                       disabled:opacity-30 disabled:cursor-not-allowed knob">
            {saving
              ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
              : <><ChevronRight size={16} /> Save to TIM's memory</>
            }
          </button>
        </div>
      )}
    </div>
  )
}
