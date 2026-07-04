import { useRef, useState } from 'react'
import { PitchDetector } from 'pitchy'

/**
 * useAudioAnalysis — records audio from the mic, detects pitch in real-time,
 * and returns the collected notes + the audio blob when done.
 */
export default function useAudioAnalysis() {
  const [notes, setNotes]     = useState([])   // [{ freq, note, time }]
  const [recording, setRecording] = useState(false)

  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])
  const audioCtxRef      = useRef(null)
  const analyserRef      = useRef(null)
  const detectorRef      = useRef(null)
  const animFrameRef     = useRef(null)
  const notesRef         = useRef([])
  const startTimeRef     = useRef(0)

  function freqToNoteName(freq) {
    if (!freq || freq < 60) return null
    const noteNames = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
    const midi = Math.round(12 * Math.log2(freq / 440) + 69)
    return noteNames[midi % 12]
  }

  async function startAnalysis() {
    notesRef.current = []
    setNotes([])
    chunksRef.current = []

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // Audio context + analyser
    const ctx      = new AudioContext()
    const source   = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    source.connect(analyser)
    audioCtxRef.current  = ctx
    analyserRef.current  = analyser
    detectorRef.current  = PitchDetector.forFloat32Array(analyser.fftSize)
    startTimeRef.current = ctx.currentTime

    // MediaRecorder for the blob
    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder
    recorder.ondataavailable = e => chunksRef.current.push(e.data)
    recorder.start()

    setRecording(true)

    // Real-time pitch detection loop
    const input = new Float32Array(analyser.fftSize)
    function detect() {
      animFrameRef.current = requestAnimationFrame(detect)
      analyser.getFloatTimeDomainData(input)
      const [freq, clarity] = detectorRef.current.findPitch(input, ctx.sampleRate)
      if (clarity > 0.85 && freq > 60 && freq < 1200) {
        const note = freqToNoteName(freq)
        const time = ctx.currentTime - startTimeRef.current
        if (note) {
          // Deduplicate — only log if note changed or >200ms passed
          const last = notesRef.current[notesRef.current.length - 1]
          if (!last || last.note !== note || time - last.time > 0.2) {
            const entry = { freq: Math.round(freq), note, time: +time.toFixed(2) }
            notesRef.current = [...notesRef.current, entry]
            setNotes([...notesRef.current])
          }
        }
      }
    }
    detect()
  }

  function stopAnalysis() {
    cancelAnimationFrame(animFrameRef.current)
    mediaRecorderRef.current?.stop()
    audioCtxRef.current?.close()
    setRecording(false)

    return new Promise(resolve => {
      if (!mediaRecorderRef.current) return resolve({ notes: notesRef.current, blob: null })
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        resolve({ notes: notesRef.current, blob })
      }
    })
  }

  return { recording, notes, startAnalysis, stopAnalysis }
}
