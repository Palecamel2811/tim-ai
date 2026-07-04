import { useEffect, useRef, useState } from 'react'

/**
 * TIMSphere — the living heart of TIM.
 *
 * A CSS 3D blob made of silver tiles arranged in a sphere pattern.
 * Reacts to audio amplitude, generation state, and TIM's dialogue.
 *
 * States:
 *   idle      — slow ambient breathe (3.2s cycle)
 *   listening — reacts to mic amplitude in real time
 *   thinking  — internal rotation, brightness pulse
 *   speaking  — ripple from centre as text types
 *
 * Props:
 *   state       — 'idle' | 'listening' | 'thinking' | 'speaking'
 *   amplitude   — 0–1 float from Web Audio API (for listening state)
 *   size        — px size of the sphere container (default 220)
 */

const TILE_COUNT = 80
const PHI = Math.PI * (3 - Math.sqrt(5)) // golden angle

function fibonacciSphere(n) {
  const points = []
  for (let i = 0; i < n; i++) {
    const y     = 1 - (i / (n - 1)) * 2
    const r     = Math.sqrt(1 - y * y)
    const theta = PHI * i
    points.push({
      x: Math.cos(theta) * r,
      y,
      z: Math.sin(theta) * r,
    })
  }
  return points
}

const TILES = fibonacciSphere(TILE_COUNT)

export default function TIMSphere({ state = 'idle', amplitude = 0, size = 220 }) {
  const [tick, setTick]       = useState(0)
  const [ripple, setRipple]   = useState(0)
  const frameRef              = useRef(null)
  const rotationRef           = useRef({ x: 0, y: 0 })
  const lastTimeRef           = useRef(null)

  // Animate rotation continuously — speed varies by state
  useEffect(() => {
    function animate(ts) {
      if (!lastTimeRef.current) lastTimeRef.current = ts
      const dt = (ts - lastTimeRef.current) / 1000
      lastTimeRef.current = ts

      const speed = state === 'thinking' ? 60 : state === 'listening' ? 20 : 8
      rotationRef.current.y += speed * dt
      rotationRef.current.x = state === 'thinking' ? 15 : 5

      setTick(t => t + 1)
      frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [state])

  // Ripple effect when speaking
  useEffect(() => {
    if (state === 'speaking') {
      setRipple(r => r + 1)
    }
  }, [state])

  const rx = rotationRef.current.x
  const ry = rotationRef.current.y

  // Project 3D point to 2D with simple rotation
  function project(px, py, pz) {
    const ryRad = (ry * Math.PI) / 180
    const rxRad = (rx * Math.PI) / 180

    // Rotate Y
    const x1 = px * Math.cos(ryRad) + pz * Math.sin(ryRad)
    const z1 = -px * Math.sin(ryRad) + pz * Math.cos(ryRad)

    // Rotate X
    const y2 = py * Math.cos(rxRad) - z1 * Math.sin(rxRad)
    const z2 = py * Math.sin(rxRad) + z1 * Math.cos(rxRad)

    const depth = z2 + 2
    const scale = 1.8 / depth

    return {
      sx: x1 * scale,
      sy: y2 * scale,
      z:  z2,
      depth,
    }
  }

  const half   = size / 2
  const radius = half * 0.72

  // Sort tiles back-to-front for correct overlap
  const projected = TILES
    .map((pt, i) => {
      const ampBoost  = state === 'listening' ? amplitude * 0.25 : 0
      const thinkBoost = state === 'thinking' ? Math.sin(tick * 0.08 + i * 0.4) * 0.06 : 0
      const scale     = 1 + ampBoost + thinkBoost
      const { sx, sy, z, depth } = project(pt.x * scale, pt.y * scale, pt.z * scale)
      return { sx, sy, z, depth, i }
    })
    .sort((a, b) => a.z - b.z)

  // Tile size based on state
  const baseTileSize = size * 0.062
  const tileSize     = state === 'listening'
    ? baseTileSize * (1 + amplitude * 0.4)
    : baseTileSize

  return (
    <div
      className="relative select-none"
      style={{ width: size, height: size }}
      aria-label="TIM — alive and listening"
    >
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(184,200,232,0.08) 0%, transparent 70%)',
          transform: state === 'thinking' ? 'scale(1.15)' : state === 'listening' ? `scale(${1 + amplitude * 0.1})` : 'scale(1)',
          transition: 'transform 0.3s ease',
        }}
      />

      {/* Sphere tiles */}
      <div className="absolute inset-0" style={{ perspective: `${size * 2}px` }}>
        {projected.map(({ sx, sy, z, i }) => {
          const isFront   = z > 0
          const depthFade = Math.max(0.15, (z + 1) / 2)
          const shimmer   = state === 'thinking'
            ? 0.5 + 0.5 * Math.sin(tick * 0.06 + i * 0.3)
            : state === 'listening'
            ? 0.4 + 0.6 * (amplitude + depthFade * 0.5)
            : depthFade

          const brightness = 0.6 + shimmer * 0.7
          const tileR      = Math.round(tileSize * (0.85 + depthFade * 0.25))

          // Silver gradient — cooler for deep tiles, brighter for front tiles
          const lightness  = Math.round(55 + depthFade * 35)
          const color      = isFront
            ? `hsl(220, 25%, ${lightness}%)`
            : `hsl(220, 18%, ${Math.round(lightness * 0.6)}%)`

          return (
            <div
              key={i}
              className="absolute rounded-sm"
              style={{
                width:  tileR,
                height: tileR,
                left:   half + sx * radius - tileR / 2,
                top:    half + sy * radius - tileR / 2,
                backgroundColor: color,
                opacity: depthFade * brightness * (isFront ? 1 : 0.6),
                transform: `rotate(${(i * 13.7) % 45}deg)`,
                boxShadow: isFront && depthFade > 0.7
                  ? `0 0 ${Math.round(tileR * 0.8)}px rgba(184,200,232,${(depthFade - 0.7) * 0.5})`
                  : 'none',
                transition: 'background-color 0.3s',
              }}
            />
          )
        })}
      </div>

      {/* Centre highlight — the "soul" of the sphere */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width:  size * 0.28,
          height: size * 0.28,
          left:   size * 0.36,
          top:    size * 0.28,
          background: 'radial-gradient(circle, rgba(240,244,255,0.18) 0%, transparent 70%)',
          opacity: state === 'thinking' ? 0.8 + 0.2 * Math.sin(tick * 0.15) : 0.5,
        }}
      />
    </div>
  )
}
