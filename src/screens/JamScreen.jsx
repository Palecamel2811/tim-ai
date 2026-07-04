import { useState, useRef, useEffect, useCallback } from 'react'
import { Loader2, Send, RotateCcw, Layers, Volume2 } from 'lucide-react'
import TIMSphere from '../components/TIMSphere'
import TIMVoice from '../components/TIMVoice'
import { getJamDialogue } from '../utils/timPersonality'
import { getProfileSummaryForMusic } from '../utils/timProfile'

const TRACK_LABELS = ['Drums', 'Bass', '808s', 'Melody', 'Pad', 'Texture']

export default function JamScreen() {
  const [instruction, setInstruction] = useState('')
  const [timLine, setTimLine]         = useState('')
  const [sphereState, setSphereState] = useState('idle')
  const [tracks, setTracks]           = useState([])        // [{label, audioUrl, muted}]
  const [building, setBuilding]       = useState(false)
  const [sessionLog, setSessionLog]   = useState([])        // conversation history
  const [error, setError]             = useState(null)
  const inputRef                      = useRef(null)

  useEffect(() => {
    setTimLine(getJamDialogue('idle'))
    setTimeout(() => inputRef.current?.focus(), 400)
  }, [])

  // Build a summary of what's in the current session
  function getSessionContext() {
    if (tracks.length === 0) return ''
    return `Current tracks: ${tracks.map(t => t.label).join(', ')}`
  }

  async function sendInstruction() {
    const inst = instruction.trim()
    if (!inst || building) return

    setInstruction('')
    setBuilding(true)
    setSphereState('thinking')
    setTimLine(getJamDialogue('building'))
    setError(null)

    // Log the instruction
    setSessionLog(log => [...log, { role: 'user', text: inst }])

    try {
      // Step 1 — translate instruction to MusicGen prompt via /api/jam
      const jamRes = await fetch('/api/jam', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          instruction:    inst,
          sessionContext: getSessionContext(),
          profileSummary: getProfileSummaryForMusic(),
        }),
      })

      const { prompt } = await jamRes.json()

      // Step 2 — generate audio via /api/generate
      const genRes = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt, duration: 8 }),
      })

      if (!genRes.ok) throw new Error('Generation failed')

      const { audioUrl } = await genRes.json()

      // Determine track label from instruction
      const lower = inst.toLowerCase()
      const label = TRACK_LABELS.find(l => lower.includes(l.toLowerCase()))
        || `Layer ${tracks.length + 1}`

      // Check if updating an existing track or adding new
      const existingIdx = tracks.findIndex(t => t.label === label)
      if (existingIdx >= 0) {
        setTracks(ts => ts.map((t, i) =>
          i === existingIdx ? { ...t, audioUrl } : t
        ))
        setSessionLog(log => [...log, {
          role: 'tim',
          text: `Updated the ${label} track. How does that feel?`
        }])
      } else {
        setTracks(ts => [...ts, { label, audioUrl, muted: false }])
        setSessionLog(log => [...log, {
          role: 'tim',
          text: `Added ${label}. ${getJamDialogue('done')}`
        }])
      }

      setTimLine(getJamDialogue('done'))
      setSphereState('idle')
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Try again.')
      setTimLine('Something went wrong. Want to try again?')
      setSphereState('idle')
    } finally {
      setBuilding(false)
    }
  }

  function toggleMute(idx) {
    setTracks(ts => ts.map((t, i) => i === idx ? { ...t, muted: !t.muted } : t))
  }

  function removeTrack(idx) {
    setTracks(ts => ts.filter((_, i) => i !== idx))
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendInstruction()
    }
  }

  return (
    <div className="flex-1 flex flex-col px-4 py-6 gap-5 max-w-2xl mx-auto w-full">

      {/* Sphere — smaller in jam mode, stays present */}
      <div className="flex flex-col items-center gap-3">
        <TIMSphere state={sphereState} size={120} />
        <TIMVoice line={timLine} className="max-w-sm text-base" />
      </div>

      {/* Live tracks */}
      {tracks.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[#6A7A9A] text-xs uppercase tracking-widest">
            Session — {tracks.length} track{tracks.length !== 1 ? 's' : ''}
          </p>
          {tracks.map((track, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 bg-[#12192A] border border-[#2A3550]
                         rounded-xl px-4 py-3 card-enter"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {/* Mute button */}
              <button
                onClick={() => toggleMute(idx)}
                className={`w-8 h-8 rounded-full flex items-center justify-center
                            text-xs font-bold transition-all shrink-0
                            ${track.muted
                              ? 'bg-[#2A3550] text-[#6A7A9A]'
                              : 'bg-[#B8C8E8]/20 text-[#B8C8E8] border border-[#B8C8E8]/30'
                            }`}
              >
                {track.muted ? 'M' : <Volume2 size={12} />}
              </button>

              {/* Label */}
              <span className="text-[#F0F4FF] text-sm font-medium w-20 shrink-0">
                {track.label}
              </span>

              {/* Waveform placeholder / audio */}
              <div className="flex-1 flex items-center gap-1 h-6 overflow-hidden">
                {Array.from({ length: 32 }, (_, i) => (
                  <div
                    key={i}
                    className="rounded-full flex-1"
                    style={{
                      height: `${20 + Math.sin(i * 0.8 + idx) * 14 + Math.sin(i * 1.4) * 10}%`,
                      backgroundColor: track.muted ? '#2A3550' : '#B8C8E8',
                      opacity: track.muted ? 0.3 : 0.6,
                    }}
                  />
                ))}
              </div>

              {/* Remove */}
              <button
                onClick={() => removeTrack(idx)}
                className="text-[#3A4A6A] hover:text-[#E05870] transition-colors shrink-0 p-1"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Session log */}
      {sessionLog.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
          {sessionLog.map((entry, i) => (
            <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <span className={`text-xs px-3 py-1.5 rounded-full max-w-xs
                ${entry.role === 'user'
                  ? 'bg-[#B8C8E8]/15 text-[#B8C8E8] border border-[#B8C8E8]/20'
                  : 'bg-[#12192A] border border-[#2A3550] text-[#6A7A9A] italic'
                }`}>
                {entry.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-[#E05870] text-xs text-center">{error}</p>
      )}

      {/* Instruction input */}
      <div className="flex items-center gap-2 bg-[#12192A] border border-[#2A3550]
                      rounded-2xl px-4 py-3 focus-within:border-[#6A8AC8] transition-colors">
        <input
          ref={inputRef}
          type="text"
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          onKeyDown={handleKey}
          placeholder={tracks.length === 0
            ? "Tell TIM what to play — 'start with some drums'…"
            : "Add to the session — '808s', 'make the drums hit harder'…"
          }
          disabled={building}
          className="flex-1 bg-transparent text-[#F0F4FF] text-sm
                     placeholder:text-[#3A4A6A] outline-none"
        />
        <button
          onClick={sendInstruction}
          disabled={!instruction.trim() || building}
          className="w-9 h-9 rounded-full flex items-center justify-center
                     bg-[#B8C8E8]/15 border border-[#B8C8E8]/20
                     text-[#B8C8E8] hover:bg-[#B8C8E8]/25
                     disabled:opacity-30 transition-all shrink-0"
        >
          {building
            ? <Loader2 size={15} className="animate-spin" />
            : <Send size={15} />
          }
        </button>
      </div>

      <p className="text-[#3A4A6A] text-xs text-center">
        Try: "Start with drums" · "Add a bassline" · "Throw in some 808s" · "Make it heavier"
      </p>
    </div>
  )
}
