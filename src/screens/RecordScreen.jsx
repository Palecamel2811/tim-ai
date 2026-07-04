import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Square, ChevronRight } from 'lucide-react'
import useAudioAnalysis from '../hooks/useAudioAnalysis'
import TIMVoice from '../components/TIMVoice'
import { getRecordDialogue } from '../utils/timPersonality'

const BAR_COUNT = 32

export default function RecordScreen() {
  const [status, setStatus]   = useState('idle')
  const [bars, setBars]       = useState(Array(BAR_COUNT).fill(3))
  const [seconds, setSeconds] = useState(0)
  const [timLine, setTimLine] = useState('')
  const timerRef              = useRef(null)
  const animFrameRef          = useRef(null)
  const analyserVisuRef       = useRef(null)
  const audioCtxVisuRef       = useRef(null)
  const streamVisuRef         = useRef(null)
  const navigate              = useNavigate()

  const { notes, startAnalysis, stopAnalysis } = useAudioAnalysis()

  useEffect(() => {
    setTimLine(getRecordDialogue('idle'))
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      clearInterval(timerRef.current)
      audioCtxVisuRef.current?.close()
    }
  }, [])

  async function startRecording() {
    await startAnalysis()

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
    setTimLine(getRecordDialogue('recording'))
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

    if (blob) {
      const url = URL.createObjectURL(blob)
      sessionStorage.setItem('tim_recording_url', url)
    }
    sessionStorage.setItem('tim_notes', JSON.stringify(detectedNotes))
    sessionStorage.setItem('tim_recording_seconds', seconds)

    setStatus('done')
    setTimLine(getRecordDialogue('done'))
  }

  const fmt = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-10">

      {/* TIM's voice */}
      <TIMVoice line={timLine} className="max-w-sm" />

      {/* Waveform visualizer */}
      <div className="flex items-end justify-center gap-[3px] h-24 w-full max-w-xs">
        {bars.map((h, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-75"
            style={{
              width: '6px',
              height: `${h}%`,
              backgroundColor: status === 'recording' ? '#4A8FD9' : '#B8C8E0',
              opacity: status === 'recording' ? 1 : 0.5,
            }}
          />
        ))}
      </div>

      {/* Detected notes badge */}
      {status === 'recording' && notes.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap justify-center max-w-xs">
          <span className="text-[#5A6A8A] text-xs uppercase tracking-widest">TIM hears:</span>
          {[...new Set(notes.map(n => n.note))].slice(-6).map((n, i) => (
            <span key={i}
              className="text-xs bg-[#D6E8F8] text-[#4A8FD9] px-2 py-0.5 rounded-full font-mono
                         border border-[#B8C8E0]">
              {n}
            </span>
          ))}
        </div>
      )}

      {/* Timer */}
      <span className="text-[#4A8FD9] font-mono text-2xl tabular-nums tracking-widest">
        {fmt(seconds)}
      </span>

      {/* Record / Stop button — knob style with concentric rings */}
      <div className="relative flex items-center justify-center">
        <div
          className={`absolute w-20 h-20 rounded-full pointer-events-none
            ${status === 'recording' ? 'mic-recording' : status === 'idle' ? 'mic-idle' : ''}
          `}
        />
        <button
          onClick={status === 'recording' ? stopRecording : startRecording}
          disabled={status === 'done'}
          className={`
            relative w-20 h-20 rounded-full flex items-center justify-center
            transition-all duration-200 z-10
            ${status === 'recording'
              ? 'bg-[#D95050] scale-110 knob-active'
              : status === 'done'
              ? 'bg-[#E4EAF6] cursor-not-allowed knob'
              : 'bg-[#4A8FD9] hover:bg-[#3A7FC9] knob'
            }
          `}
        >
          {status === 'recording'
            ? <Square size={26} className="text-white" />
            : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke={status === 'done' ? '#8A9AB8' : 'white'}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
            )
          }
        </button>
      </div>

      {/* Hint text */}
      <p className="text-[#8A9AB8] text-xs text-center">
        {status === 'idle'      && 'Tap the mic and hum a melody, sing a rhythm, or make any sound'}
        {status === 'recording' && "Tap the square to stop when you're ready"}
        {status === 'done'      && 'Happy with that? Head to Create →'}
      </p>

      {/* Next button */}
      {status === 'done' && (
        <button
          onClick={() => navigate('/create')}
          className="flex items-center gap-2 px-8 py-3 bg-[#4A8FD9] text-white
                     font-medium rounded-full hover:bg-[#3A7FC9] transition-all knob"
        >
          Take it to Create <ChevronRight size={18} />
        </button>
      )}
    </div>
  )
}
