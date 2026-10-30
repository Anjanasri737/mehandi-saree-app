import { useEffect, useRef } from 'react'
import './Butterflies.css'

// Exactly 12 butterflies: 6 medium + 6 very small. Do not add or remove entries.
const BUTTERFLIES = [
  { size: 'md', speed: 46, flap: 0.7, sway: 3.8, wave: 1.1, rise: true, pattern: 0, shimmer: true,
    c: { u1: '#7651A8', u2: '#9B78CF', l1: '#D3BFEF', l2: '#EDE3FA', spot: '#FFFFFF', edge: '#5A3D86' } },
  { size: 'md', speed: 38, flap: 0.85, sway: 4.4, wave: 0.9, rise: false, pattern: 1, shimmer: false,
    c: { u1: '#D3BFEF', u2: '#EDE3FA', l1: '#EDE3FA', l2: '#FFFFFF', spot: '#7651A8', edge: '#7651A8' } },
  { size: 'md', speed: 54, flap: 0.6, sway: 3.4, wave: 1.3, rise: true, pattern: 2, shimmer: true,
    c: { u1: '#7651A8', u2: '#D3BFEF', l1: '#D3BFEF', l2: '#7651A8', spot: '#EDE3FA', edge: '#5A3D86' } },
  { size: 'md', speed: 42, flap: 0.78, sway: 4.1, wave: 1.0, rise: false, pattern: 3, shimmer: false,
    c: { u1: '#EDE3FA', u2: '#D3BFEF', l1: '#FFFFFF', l2: '#EDE3FA', spot: '#7651A8', edge: '#9B78CF' } },

  { size: 'sm', speed: 66, flap: 0.4, sway: 2.6, wave: 1.6, rise: true, pattern: 0, shimmer: false,
    c: { u1: '#D3BFEF', u2: '#B79BE0', l1: '#EDE3FA', l2: '#FFFFFF', spot: '#FFFFFF', edge: '#9B78CF' } },
  { size: 'sm', speed: 78, flap: 0.36, sway: 2.3, wave: 1.9, rise: false, pattern: 3, shimmer: true,
    c: { u1: '#EDE3FA', u2: '#D3BFEF', l1: '#FFFFFF', l2: '#EDE3FA', spot: '#B79BE0', edge: '#B79BE0' } },
  { size: 'sm', speed: 60, flap: 0.44, sway: 2.9, wave: 1.5, rise: true, pattern: 1, shimmer: false,
    c: { u1: '#B79BE0', u2: '#D3BFEF', l1: '#D3BFEF', l2: '#EDE3FA', spot: '#FFFFFF', edge: '#7651A8' } },
  { size: 'sm', speed: 72, flap: 0.38, sway: 2.5, wave: 1.7, rise: false, pattern: 2, shimmer: true,
    c: { u1: '#FFFFFF', u2: '#EDE3FA', l1: '#EDE3FA', l2: '#D3BFEF', spot: '#B79BE0', edge: '#B79BE0' } },
    { size: 'md', speed: 50, flap: 0.66, sway: 3.6, wave: 1.2, rise: true, pattern: 1, shimmer: true,
    c: { u1: '#9B78CF', u2: '#D3BFEF', l1: '#EDE3FA', l2: '#D3BFEF', spot: '#FFFFFF', edge: '#7651A8' } },
  { size: 'md', speed: 40, flap: 0.82, sway: 4.2, wave: 0.95, rise: false, pattern: 0, shimmer: false,
    c: { u1: '#D3BFEF', u2: '#9B78CF', l1: '#EDE3FA', l2: '#FFFFFF', spot: '#7651A8', edge: '#5A3D86' } },

  { size: 'sm', speed: 70, flap: 0.4, sway: 2.4, wave: 1.8, rise: true, pattern: 3, shimmer: true,
    c: { u1: '#EDE3FA', u2: '#B79BE0', l1: '#FFFFFF', l2: '#EDE3FA', spot: '#9B78CF', edge: '#B79BE0' } },
  { size: 'sm', speed: 62, flap: 0.42, sway: 2.7, wave: 1.6, rise: false, pattern: 0, shimmer: false,
    c: { u1: '#D3BFEF', u2: '#EDE3FA', l1: '#EDE3FA', l2: '#FFFFFF', spot: '#FFFFFF', edge: '#9B78CF' } },
]

// Start positions (as fractions of the screen) so they begin spread over top, middle and bottom.
const START_X = [0.15, 0.72, 0.42, 0.88, 0.55, 0.1, 0.3, 0.92, 0.65, 0.22, 0.8, 0.48]
const START_Y = [0.14, 0.3, 0.52, 0.72, 0.2, 0.42, 0.62, 0.86, 0.9, 0.78, 0.1, 0.36]

function Wing({ pattern, c, uid, shimmer }) {
  return (
    <>
      <path d="M52 38C60 8 92 2 96 22C98 36 76 44 52 42Z" fill={`url(#bfu${uid})`} stroke={c.edge} strokeWidth="1" strokeLinejoin="round" />
      <path d="M52 42C74 44 90 52 82 68C74 78 58 66 52 46Z" fill={`url(#bfl${uid})`} stroke={c.edge} strokeWidth="1" strokeLinejoin="round" />
      {pattern === 0 && (
        <>
          <circle cx="78" cy="20" r="5" fill={c.spot} opacity="0.85" />
          <circle cx="68" cy="31" r="2.5" fill={c.spot} opacity="0.8" />
          <circle cx="76" cy="58" r="3" fill={c.spot} opacity="0.8" />
        </>
      )}
      {pattern === 1 && (
        <>
          <path d="M54 40C66 25 80 17 92 22M54 42C70 40 82 36 94 30M54 44C68 52 78 58 80 66" stroke={c.spot} strokeWidth="0.9" fill="none" opacity="0.55" />
          <circle cx="86" cy="25" r="3" fill={c.spot} opacity="0.8" />
        </>
      )}
      {pattern === 2 && (
        <>
          <circle cx="80" cy="22" r="6.5" fill="none" stroke={c.spot} strokeWidth="1.4" opacity="0.85" />
          <circle cx="80" cy="22" r="2.2" fill={c.spot} opacity="0.9" />
          <circle cx="74" cy="58" r="3.5" fill="none" stroke={c.spot} strokeWidth="1.2" opacity="0.8" />
        </>
      )}
      {pattern === 3 && (
        <>
          <circle cx="90" cy="26" r="2" fill={c.spot} opacity="0.85" />
          <circle cx="83" cy="33" r="2" fill={c.spot} opacity="0.85" />
          <circle cx="72" cy="60" r="2.4" fill={c.spot} opacity="0.85" />
          <circle cx="66" cy="52" r="2" fill={c.spot} opacity="0.85" />
        </>
      )}
      {shimmer && (
        <path className="bf-shimmer" d="M52 38C60 8 92 2 96 22C98 36 76 44 52 42Z" fill={`url(#bfs${uid})`} />
      )}
    </>
  )
}

function Butterfly({ b, uid }) {
  const { c } = b
  return (
    <svg viewBox="0 0 100 80" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`bfu${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.u1} />
          <stop offset="1" stopColor={c.u2} />
        </linearGradient>
        <linearGradient id={`bfl${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.l1} />
          <stop offset="1" stopColor={c.l2} />
        </linearGradient>
        <linearGradient id={`bfs${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="bf-wing">
        <g transform="translate(100 0) scale(-1 1)">
          <Wing pattern={b.pattern} c={c} uid={uid} shimmer={b.shimmer} />
        </g>
      </g>
      <g className="bf-wing">
        <Wing pattern={b.pattern} c={c} uid={uid} shimmer={b.shimmer} />
      </g>
      <ellipse cx="50" cy="42" rx="2.2" ry="15" fill={c.edge} />
      <path d="M50 28Q46 17 40 12M50 28Q54 17 60 12" stroke={c.edge} strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function Butterflies() {
  const refs = useRef([])

  useEffect(() => {
    const els = refs.current
    const rand = (a, z) => a + Math.random() * (z - a)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let w = window.innerWidth
    let h = window.innerHeight
    const st = BUTTERFLIES.map((_, i) => ({
      x: START_X[i] * w,
      y: START_Y[i] * h,
      theta: rand(0, Math.PI * 2),
      target: 0,
      next: 0,
      phase: rand(0, 6.28),
      bw: 40,
    }))
    st.forEach((s) => { s.target = s.theta })

    const place = (s, el) => {
      if (!el) return
      el.style.transform =
        `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0) rotate(${((s.theta * 180) / Math.PI + 90).toFixed(1)}deg)`
    }

    const measure = () => {
      w = window.innerWidth
      h = window.innerHeight
      st.forEach((s, i) => {
        if (els[i]) s.bw = els[i].offsetWidth || 40
        s.x = Math.min(Math.max(s.x, 0), Math.max(w - s.bw, 0))
        s.y = Math.min(Math.max(s.y, 0), Math.max(h - s.bw, 0))
        place(s, els[i])
      })
    }

    measure()
    window.addEventListener('resize', measure)

    // Reduced motion: keep the 8 butterflies still (CSS also stops the wing flapping).
    if (reduce) {
      return () => window.removeEventListener('resize', measure)
    }

    let raf
    let last = performance.now()
    st.forEach((s) => { s.next = last + rand(500, 3000) })
    const turnRate = 1.7 // radians per second: how quickly they can turn

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      for (let i = 0; i < st.length; i++) {
        const b = BUTTERFLIES[i]
        const s = st[i]

        // Now and then, choose a new direction.
        if (now > s.next) {
          s.target = s.theta + rand(-1.5, 1.5)
          if (b.rise && Math.sin(s.theta) > 0 && Math.random() < 0.5) {
            s.target = -Math.PI / 2 + rand(-0.9, 0.9) // head upward
          }
          s.next = now + rand(2200, 5800)
        }

        // Steer gently away from the screen edges (no teleporting, no leaving).
        const m = 70
        let ax = 0
        let ay = 0
        if (s.x < m) ax = 1
        else if (s.x > w - s.bw - m) ax = -1
        if (s.y < m) ay = 1
        else if (s.y > h - s.bw - m) ay = -1
        if (ax || ay) s.target = Math.atan2(ay || Math.sin(s.theta), ax || Math.cos(s.theta))

        // Turn smoothly toward the target.
        let diff = s.target - s.theta
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        const maxTurn = turnRate * dt
        s.theta += Math.max(-maxTurn, Math.min(maxTurn, diff))

        // Gentle weaving makes the flight path wavy.
        s.theta += Math.sin((now / 1000) * b.wave * 2 + s.phase) * 0.9 * dt

        // Fly forward, with small speed surges.
        const v = b.speed * (1 + 0.25 * Math.sin(now / 650 + s.phase))
        s.x += Math.cos(s.theta) * v * dt
        s.y += Math.sin(s.theta) * v * dt
        s.x = Math.min(Math.max(s.x, -4), w - s.bw + 4)
        s.y = Math.min(Math.max(s.y, -4), h - s.bw * 0.8 + 4)

        place(s, els[i])
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <div className="bf-layer" aria-hidden="true">
      {BUTTERFLIES.map((b, i) => (
        <div
          key={i}
          ref={(el) => { refs.current[i] = el }}
          className={`bf bf-${b.size}`}
          style={{
            '--flap': `${b.flap}s`,
            '--flap-delay': `${-(i * 0.13).toFixed(2)}s`,
            '--sway': `${b.sway}s`,
            '--shimmer-delay': `${-(i * 0.9).toFixed(1)}s`,
          }}
        >
          <div className="bf-sway">
            <Butterfly b={b} uid={i} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default Butterflies