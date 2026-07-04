import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, Square, ChevronRight } from 'lucide-react'
import useAudioAnalysis from '../hooks/useAudioAnalysis'

const BAR_COUNT = 32

export default function RecordScreen() {
  const [status, setStatus]   = useState('idle')   // idle | recording | done
  const [bars, setBars]       = useState(Array(BAR_COUNT).fill(3))
  const [seconds, setSeconds] = useState(0)
  const timerRef              = useRef(null)
  const animFrameRef          = useRef(null)
  const analyserVisuRef       = useRef(null)  // separate analyser just for the waveform bars
  const audioCtxVisuRef       = useRef(null)
  const streamVisuRef         = useRef(null)
  const navigate              = useNavigate()

  const { recording, notes, startAnalysis, stopAnalysis } = useAudioAnalysis()

  const timLabels = {
    idle:      "Hey — hum something. Anything. I'm listening.",
    recording: "I hear you… keep going.",
    done:      "Got it. Let's make something from that.",
  }

  useEffect(() => () => {
    cancelAnimationFrame(animFrameRef.current)
    clearInterval(timerRef.current)
    audioCtxVisuRef.current?.close()
  }, [])

  async function startRecording() {
    // Start pitch analysis (handles mic + MediaRecorder internally)
    await startAnalysis()

    // Separate stream just for the visual waveform bars
    const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamVisuRef.current = stream
    const ctx      = new AudioContext()
    const source   = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = BAR_COUNT * 2
    source.connect(analyser)
    audioCtxVisuRef.current  = ctx
    analyserVisuRef.current  = analyser

    setStatus('recording')
    setSeconds(0)
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)

    const dataArr = new Uint8Array(analyser.frequencyBinCount)
    function draw() {
      animFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArr)
      setBars(Array.from(dataArr).map(v => Math.max(3, (v / 255) * 100)))
    }
    draw()
  }

  async function stopRecording() {
    clearInterval(timerRef.current)
    cancelAnimationFrame(animFrameRef.current)
    setBars(Array(BAR_COUNT).fill(3))
    streamVisuRef.current?.getTracks().forEach(t => t.stop())
    audioCtxVisuRef.current?.close()

    const { notes: detectedNotes, blob } = await stopAnalysis()

    // Pass recording + notes to Create screen via sessionStorage
    if (blob) {
      const url = URL.createObjectURL(blob)
      sessionStorage.setItem('tim_recording_url', url)
    }
    sessionStorage.setItem('tim_notes', JSON.stringify(detectedNotes))
    sessionStorage.setItem('tim_recording_seconds', seconds)

    setStatus('done')
  }

  function handleNext() {
    navigate('/create')
  }

  const fmt = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-10">

      {/* TIM's voice */}
      <p className="text-[#F5E6C8] text-lg text-center max-w-sm opacity-80 italic transition-all duration-500">
        "{timLabels[status]}"
      </p>

      {/* Waveform visualizer */}
      <div className="flex items-end justify-center gap-[3px] h-24 w-full max-w-xs">
        {bars.map((h, i) => (
          <div
            key={i}
            className="rounded-full bg-[#F5C842] transition-all duration-75"
            style={{
              width: '6px',
              height: `${h}%`,
              opacity: status === 'recording' ? 1 : 0.25,
            }}
          />
        ))}
      </div>

      {/* Detected notes badge */}
      {status === 'recording' && notes.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap justify-center max-w-xs">
          <span className="text-[#F5E6C8] text-xs opacity-40 uppercase tracking-widest">TIM hears:</span>
          {[...new Set(notes.map(n => n.note))].slice(-6).map((n, i) => (
            <span key={i} className="text-xs bg-[#F5C842]/20 text-[#F5C842] px-2 py-0.5 rounded-full font-mono">
              {n}
            </span>
          ))}
        </div>
      )}

      {/* Timer */}
      <span className="text-[#F5C842] font-mono text-2xl tabular-nums">
        {fmt(seconds)}
      </span>

      {/* Record / Stop button */}
      <button
        onClick={status === 'recording' ? stopRecording : startRecording}
        disabled={status === 'done'}
        className={`
          w-20 h-20 rounded-full flex items-center justify-center
          transition-all duration-200 shadow-lg
          ${status === 'recording'
            ? 'bg-red-500 hover:bg-red-400 scale-110'
            : status === 'done'
            ? 'bg-[#2A2A2A] cursor-not-allowed opacity-40'
            : 'bg-[#F5C842] hover:bg-yellow-300'
          }
        `}
      >
        {status === 'recording'
          ? <Square size={28} className="text-white" />
          : <Mic size={28} className="text-[#0D0D0D]" />
        }
      </button>

      {/* Hint text */}
      <p className="text-[#F5E6C8] text-xs opacity-40 text-center">
        {status === 'idle'      && 'Tap the mic and hum a melody, sing a rhythm, or make any sound'}
        {status === 'recording' && "Tap the square to stop when you're ready"}
        {status === 'done'      && 'Happy with that? Head to Create →'}
      </p>

      {/* Next button */}
      {status === 'done' && (
        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-8 py-3 bg-[#F5C842] text-[#0D0D0D]
                     font-semibold rounded-full hover:bg-yellow-300 transition-all"
        >
          Take it to Create <ChevronRight size={18} />
        </button>
      )}
    </div>
  )
}
