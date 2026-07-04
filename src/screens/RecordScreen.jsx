import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, Square, ChevronRight } from 'lucide-react'

// Number of waveform bars to render
const BAR_COUNT = 32

export default function RecordScreen() {
  const [status, setStatus]       = useState('idle')   // idle | recording | done
  const [bars, setBars]           = useState(Array(BAR_COUNT).fill(3))
  const [seconds, setSeconds]     = useState(0)
  const [timLabel, setTimLabel]   = useState(getTimLabel('idle'))

  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])
  const analyserRef      = useRef(null)
  const animFrameRef     = useRef(null)
  const timerRef         = useRef(null)
  const audioBlobRef     = useRef(null)
  const navigate         = useNavigate()

  // Cleanup on unmount
  useEffect(() => () => {
    cancelAnimationFrame(animFrameRef.current)
    clearInterval(timerRef.current)
  }, [])

  function getTimLabel(s) {
    if (s === 'idle')      return "Hey — hum something. Anything. I'm listening."
    if (s === 'recording') return "I hear you… keep going."
    if (s === 'done')      return "Got it. Let's make something from that."
    return ''
  }

  async function startRecording() {
    chunksRef.current = []
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // Set up analyser for live waveform
    const ctx      = new AudioContext()
    const source   = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = BAR_COUNT * 2
    source.connect(analyser)
    analyserRef.current = analyser

    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = e => chunksRef.current.push(e.data)
    recorder.onstop = () => {
      audioBlobRef.current = new Blob(chunksRef.current, { type: 'audio/webm' })
      stream.getTracks().forEach(t => t.stop())
      cancelAnimationFrame(animFrameRef.current)
      setBars(Array(BAR_COUNT).fill(3))
    }

    recorder.start()
    setStatus('recording')
    setTimLabel(getTimLabel('recording'))
    setSeconds(0)

    // Timer
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)

    // Live waveform animation
    const dataArr = new Uint8Array(analyser.frequencyBinCount)
    function draw() {
      animFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArr)
      const heights = Array.from(dataArr).map(v => Math.max(3, (v / 255) * 100))
      setBars(heights)
    }
    draw()
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    clearInterval(timerRef.current)
    setStatus('done')
    setTimLabel(getTimLabel('done'))
  }

  function handleNext() {
    if (!audioBlobRef.current) return
    // Store blob URL for Create screen to pick up
    const url = URL.createObjectURL(audioBlobRef.current)
    sessionStorage.setItem('tim_recording_url', url)
    sessionStorage.setItem('tim_recording_seconds', seconds)
    navigate('/create')
  }

  const fmt = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-10">

      {/* TIM's voice */}
      <p className="text-[#F5E6C8] text-lg text-center max-w-sm opacity-80 italic transition-all duration-500">
        "{timLabel}"
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
              animationDelay: `${(i * 0.8) / BAR_COUNT}s`,
            }}
          />
        ))}
      </div>

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
        {status === 'recording' && 'Tap the square to stop when you\'re ready'}
        {status === 'done'      && 'Happy with that? Head to Create →'}
      </p>

      {/* Next button — only visible after recording */}
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
