import { CanvasTexture, CircleGeometry, Color, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry, type Object3D } from 'three'
import { DOT, seatMateHat } from './models'
import type { BodyKind } from './sprites'

export type MateBehavior = 'awake' | 'sleeping' | 'working'
export type MateGesture = 'orbit' | 'ping' | 'wave' | 'stretch'
export type MateVisualState = MateBehavior | 'waking'

const DURATION: Record<MateGesture, number> = { orbit: 1700, ping: 950, wave: 1600, stretch: 1650 }
/** The little celebration a mate does when a stretch of work wraps up. */
const DONE_MS = 1200
const SPIN_MS = 900
/** Arriving: it turns in from profile, like a card being flipped over. */
const ENTER_MS = 750
const MODES: MateBehavior[] = ['sleeping', 'awake', 'working']
const TAU = Math.PI * 2
/** How far below its centre each shape reaches: lets them rest on the floor and squash from the bottom. */
const HALF: Record<BodyKind, number> = { blob: .9, bot: .775, owl: .957, star: .98 }

/* ── easing and timing helpers ───────────────────────────────── */

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const smooth = (v: number) => { const x = clamp(v); return x * x * (3 - 2 * x) }
const fract = (v: number) => v - Math.floor(v)
const lerp = (a: number, b: number, w: number) => a + (b - a) * w
/** Sine ease in-out: the gentlest way to get from 0 to 1. */
const inOut = (v: number) => .5 - .5 * Math.cos(Math.PI * clamp(v))
/** Eases out past the target and settles back: a small, soft overshoot. */
const backOut = (v: number) => { const x = clamp(v) - 1; return 1 + 2.2 * x * x * x + 1.2 * x * x }
/** 0 → 1, hold, → 0 across [0, 1]: rises over the first `a`, falls over the last `b`. */
const swell = (p: number, a = .25, b = .3) => (p <= 0 || p >= 1 ? 0 : p < a ? smooth(p / a) : p > 1 - b ? smooth((1 - p) / b) : 1)
/** Eased path through [time, value] keyframes. */
function keys(p: number, k: readonly (readonly [number, number])[]) {
  if (p <= k[0][0]) return k[0][1]
  for (let i = 1; i < k.length; i++) if (p <= k[i][0]) return lerp(k[i - 1][1], k[i][1], smooth((p - k[i - 1][0]) / (k[i][0] - k[i - 1][0])))
  return k[k.length - 1][1]
}
/** Holds each value of a loop, then glides to the next one over the last 30% of its step. */
function glide(v: number, values: readonly number[]) {
  const n = values.length, i = ((Math.floor(v) % n) + n) % n
  return lerp(values[i], values[(i + 1) % n], smooth((fract(v) - .7) / .3))
}
/** A beat: quicker in than out, no sudden starts or stops. Peaks at 28% of each beat. */
const tap = (v: number) => { const f = fract(v); return f < .28 ? smooth(f / .28) : 1 - smooth((f - .28) / .72) }
/** Smooth drift in [-1, 1] that never quite repeats. */
const drift = (t: number, seed: number) => Math.sin(t * 1.13 + seed) * .55 + Math.sin(t * 2.07 + seed * 1.9) * .3 + Math.sin(t * 3.31 + seed * 2.7) * .15
/** One hop over [0, 1]: eases off the ground and back onto it. */
const arc = (p: number) => (p <= 0 || p >= 1 ? 0 : Math.sin(Math.PI * smooth(p)))
/** A short squash right after a landing at `at`. */
const land = (p: number, at: number, len = .12) => arc((p - at) / len)

/** Critically damped spring: eases in and out, never overshoots. Sub-stepped so long frames stay stable. */
function follow<K extends string>(x: Record<K, number>, v: Record<K, number>, key: K, goal: number, stiffness: number, dt: number) {
  const steps = Math.max(1, Math.ceil(dt * 120)), h = dt / steps
  for (let i = 0; i < steps; i++) {
    v[key] += (stiffness * stiffness * (goal - x[key]) - 2 * stiffness * v[key]) * h
    x[key] += v[key] * h
  }
}

/* ── pose channels ───────────────────────────────────────────── */

const CHANNELS = ['x', 'y', 'rx', 'ry', 'rz', 'sx', 'sy', 'lookX', 'lookY', 'eye', 'happy', 'dots'] as const
type Channel = (typeof CHANNELS)[number]
type Pose = Record<Channel, number>
const NEUTRAL: Pose = { x: 0, y: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, lookX: 0, lookY: 0, eye: 1, happy: 0, dots: 0 }
const ZERO = Object.fromEntries(CHANNELS.map(c => [c, 0])) as Pose
// How briskly each channel catches up with its target (spring stiffness, 1/s). Eyes move fastest.
const STIFF: Pose = { x: 8, y: 12, rx: 10, ry: 9, rz: 10, sx: 14, sy: 14, lookX: 17, lookY: 17, eye: 30, happy: 12, dots: 7 }
const addScaled = (out: Pose, src: Pose, w: number) => { for (const c of CHANNELS) out[c] += src[c] * w }

/** Effects collected while building a frame that are not part of the pose. */
type Fx = { spin: number; zoom: number; flash: number; burst: number; pulse: number }

/* ── personalities ───────────────────────────────────────────── */

type Fidget = 'hop' | 'peek' | 'wiggle' | 'tilt' | 'yawn' | 'bounce' | 'spin' | 'groove' | 'shimmy'
type Persona = {
  float: number // seconds per float cycle
  bob: number // how high the float goes
  wobble: number // how much it rocks
  look: number // how far the eyes roam
  beat: number // beats per second while working
  cycle: number // seconds per work loop: focus → review → result
  blink: number // blink speed
  fidgets: readonly Fidget[]
}
const PERSONA: Record<BodyKind, Persona> = {
  // BOB: calm and round; hops, peeks, a happy wiggle now and then
  blob: { float: 3.2, bob: .055, wobble: 1, look: 1, beat: 2.2, cycle: 6.4, blink: 1, fidgets: ['hop', 'peek', 'wiggle', 'tilt', 'yawn'] },
  // MAX: grooves to whatever is in the headphones
  bot: { float: 2.8, bob: .045, wobble: .7, look: .85, beat: 2.6, cycle: 5.2, blink: 1.25, fidgets: ['groove', 'peek', 'bounce', 'spin', 'tilt'] },
  // IGGY: slow and watchful behind the glasses
  owl: { float: 3.8, bob: .04, wobble: .6, look: 1.25, beat: 1.6, cycle: 7.4, blink: .7, fidgets: ['peek', 'tilt', 'yawn', 'peek', 'hop'] },
  // NOVA: bouncy, spins and shimmies with her little silver pin
  star: { float: 2.6, bob: .07, wobble: 1.3, look: 1.1, beat: 2.4, cycle: 5.6, blink: 1.1, fidgets: ['spin', 'shimmy', 'hop', 'wiggle', 'bounce'] },
}
const FIDGET_MS: Record<Fidget, number> = { hop: 1200, peek: 2600, wiggle: 1500, tilt: 1900, yawn: 2600, bounce: 1300, spin: 1500, groove: 2600, shimmy: 1500 }

/** A soft round shadow for under the dot. */
function shadowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(20,24,18,.5)')
  grad.addColorStop(.5, 'rgba(20,24,18,.22)')
  grad.addColorStop(1, 'rgba(20,24,18,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  return new CanvasTexture(c)
}

/** Brings a dot to life. Adds only runtime helpers (orbiting dots, a contact shadow); the model itself is untouched. */
export function createMateAnimator(model: Group, body: BodyKind, initial: MateBehavior, options: { hideInactiveEyes?: boolean; cheapEffects?: boolean } = {}) {
  const P = PERSONA[body], C = DOT.center, H = HALF[body]
  const rig = model.getObjectByName('rig')!, bodyNode = model.getObjectByName('body')!, face = model.getObjectByName('face')!
  const baseYaw = rig.rotation.y
  const eyes = ['eyeL', 'eyeR'].map(name => {
    const eye = model.getObjectByName(name)!
    const bead = eye.getObjectByName('bead')!, happy = eye.getObjectByName('happy')!, shut = eye.getObjectByName('shut')!
    return { bead, happy, shut, bead0: bead.scale.clone() }
  })
  // Accessories react to movement; the fitted silver pin only rocks slightly.
  const wobblers = ['hat', 'brooch', 'tuftL', 'tuftR'].map(name => model.getObjectByName(name)).filter((o): o is Object3D => !!o)
    .map(node => ({ node, x0: node.rotation.x, y0: node.rotation.y, z0: node.rotation.z, limit: node.name === 'hat' ? .12 : node.name === 'brooch' ? .025 : .5, ax: 0, az: 0, vx: 0, vz: 0 }))

  // three little dots orbit while it works, like a "typing…" indicator
  // Use the mate's own colour for its animation effects.
  const tint = new Color(model.userData.tint ?? ((model.getObjectByName('shape') as Mesh).material as MeshStandardMaterial).color)
  const dotTint = tint.clone().lerp(tint.clone().set('#ffffff'), .25)
  const dotMat = options.cheapEffects
    ? new MeshBasicMaterial({ color: dotTint, toneMapped: false })
    : new MeshStandardMaterial({ color: dotTint, emissive: tint, emissiveIntensity: .45, roughness: .3 })
  const orbit = new Group()
  orbit.name = 'orbit'
  orbit.position.y = C
  orbit.rotation.x = .32
  rig.add(orbit)
  const orbitDots = [0, 1, 2].map(() => {
    const m = new Mesh(new SphereGeometry(.1, 20, 14), dotMat)
    m.castShadow = true
    m.visible = false
    orbit.add(m)
    return m
  })
  // a soft contact shadow that tightens as the dot comes down
  const shadowMat = new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false })
  const shadow = new Mesh(new CircleGeometry(1, 48), shadowMat)
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = .004
  shadow.renderOrder = -1
  model.add(shadow)

  let mode = initial, gesture: MateGesture | null = null, gestureStart = 0, cancelAt = -1, wakingStart = -10_000, orbit360 = 0
  const start = performance.now()
  let previous = start, workStart = start, doneStart = -10_000, initialized = false
  let spinAt = -1, frameNow = start, orbitAngle = 0
  const pose: Pose = { ...NEUTRAL }, vel: Pose = { ...ZERO }
  const weight = { sleeping: 0, awake: 0, working: 0 }, weightVel = { sleeping: 0, awake: 0, working: 0 }
  weight[initial] = 1
  const aim = { x: 0, y: 0, on: 0 }, aimVel = { x: 0, y: 0, on: 0 }
  const habit = { gain: 1 }, habitVel = { gain: 0 }
  let last = { tiltX: 0, tiltZ: 0, lift: 0 }
  let fidget: { kind: Fidget; start: number; dur: number; dir: number } | null = null
  let nextFidget = start + 1600 + Math.random() * 1600, lastFidget: Fidget | null = null
  let blinkAt = start + 900 + Math.random() * 2200, blinkStart = -10_000, blinkTwice = false

  const blinkAmount = (now: number) => {
    if (now >= blinkAt) { blinkStart = now; blinkTwice = Math.random() < .2; blinkAt = now + 2400 + Math.random() * 3600 }
    const close = 70 / P.blink, open = 120 / P.blink
    const once = (ms: number) => (ms < 0 ? 0 : ms < close ? smooth(ms / close) : ms < close + open ? 1 - smooth((ms - close) / open) : 0)
    const ms = now - blinkStart
    return Math.max(once(ms), blinkTwice ? once(ms - 260 / P.blink) : 0)
  }

  /* ── one pose per behaviour ─────────────────────────────────── */

  // Asleep: settled on the floor, a little flattened, breathing slowly.
  const sleepPose = (t: number) => {
    const o = { ...NEUTRAL }
    const breath = Math.sin((t * TAU) / 4.2)
    o.sy = .85 + breath * .02; o.sx = 1.07 - breath * .01
    o.y = -(C - H) + .012
    o.rz = .06; o.rx = .12
    o.eye = .06; o.lookY = -.5
    return o
  }

  // Idle: floating, rocking gently, eyes wandering.
  const idlePose = (t: number) => {
    const o = { ...NEUTRAL }
    const phase = (t * TAU) / P.float
    o.y = Math.sin(phase) * P.bob
    // a touch taller while rising, rounder at the top of the float
    o.sy = 1 + Math.cos(phase) * .022; o.sx = 1 - Math.cos(phase) * .011
    o.rz = Math.sin((t * TAU) / 5.3) * .035 * P.wobble
    o.rx = Math.sin((t * TAU) / 4.1 + 1) * .025 * P.wobble
    o.ry = drift(t * .25, 2) * .1
    o.x = Math.sin((t * TAU) / 7.7) * .03
    o.lookX = drift(t * .3, 1) * .5 * P.look
    o.lookY = drift(t * .27, 4) * .3
    return o
  }

  // A small celebration: happy eyes, the orbiting dots burst out, and a hop in each one's own way.
  const cheer = (p: number, e: number, b: Pose, d: Pose, fx: Fx, w: number) => {
    b.happy += e; b.lookY += .3 * e; b.rx -= .08 * e
    fx.burst = Math.max(fx.burst, swell(p, .05, .5) * e * w)
    fx.flash = Math.max(fx.flash, swell(p, .1, .5) * e * w)
    if (body === 'blob') {
      // BOB: two happy hops
      d.y += (arc(p / .4) * .16 + arc((p - .45) / .35) * .1) * w
      d.sy += (arc(p / .4) * .05 - land(p, .4) * .08 - land(p, .8) * .06) * w
    } else if (body === 'bot') {
      // MAX: one big hop and a pleased little shake
      d.y += arc(p / .55) * .22 * w
      d.sy += (arc(p / .55) * .08 - land(p, .55) * .1) * w
      d.rz += Math.sin(clamp((p - .5) / .45) * TAU * 1.5) * .08 * e * w * swell((p - .5) / .45, .2, .2)
    } else if (body === 'owl') {
      // IGGY: a delighted wiggle behind the glasses
      d.rz += Math.sin(clamp(p / .8) * TAU * 2) * .12 * e * w * swell(p / .8, .15, .15)
      d.y += arc(p / .5) * .08 * w
      fx.zoom += .15 * e * w
    } else {
      // NOVA: a big hop with a full spin
      d.y += arc(p / .7) * .25 * w
      d.sy += (arc(p / .7) * .08 - land(p, .7) * .1) * w
      if (spinAt < 0 && w > .5 && p < .2) spinAt = frameNow
    }
  }

  // Work: three dots orbit; a loop of heads-down focus, a review sweep, then a result.
  const workPose = (t: number, tw: number, d: Pose, fx: Fx, w: number) => {
    const o = { ...NEUTRAL }
    const phase = fract(tw / P.cycle)
    const focus = swell(phase / .5, .1, .14)
    const review = swell((phase - .5) / .32, .22, .22)
    const result = swell((phase - .82) / .18, .2, .25)
    const rp = clamp((phase - .5) / .32), fp = clamp((phase - .82) / .18)
    const beat = tw * P.beat
    // hovers a little higher and tighter, leaning in
    o.y = .05 + Math.sin(t * TAU * .9) * .03
    o.sy = 1 + Math.sin(t * TAU * .9 + 1.2) * .015; o.sx = 1 - Math.sin(t * TAU * .9 + 1.2) * .008
    o.rx = .03 + .1 * focus
    // reading: quick glances along a line, then a sweep across the results
    o.lookX = glide(tw * 1.5, [-.35, .25, -.1, .4, -.25, .1]) * focus * .9 + Math.sin(rp * TAU) * .9 * review
    o.lookY = -.35 * focus + .1 * review
    o.ry = o.lookX * .12
    o.eye = 1 - .22 * focus
    o.dots = 1
    // a nod on every beat
    const nod = tap(beat)
    d.rx += nod * .05 * focus * w; d.y += nod * .012 * focus * w
    fx.pulse = Math.max(fx.pulse, nod * focus)
    if (body === 'bot') {
      // MAX grooves along to the market's music
      d.rx += nod * .06 * w
      d.rz += Math.sin(beat * Math.PI) * .03 * w
      o.happy = .25 * focus
    } else if (body === 'owl') {
      // IGGY: slow turns with a hold on each wallet; the eyes lead, glasses zoom in
      o.ry = glide(tw / 1.7, [0, .35, .35, -.28, -.28, .12]) * (1 - result)
      o.lookX = o.ry * 2.2
      fx.zoom += .12 * swell(fract(tw / 1.7) / .7, .3, .3) * (1 - result) * w
    } else if (body === 'star') {
      // NOVA bounces to the beat and the orbiting dots flare with her
      const bounce = Math.abs(Math.sin(tw * Math.PI * P.beat * .5)) ** 1.5, energy = (focus + review * .5) * w
      d.y += bounce * .09 * energy
      d.sy += (bounce - .5) * .07 * energy; d.sx -= (bounce - .5) * .035 * energy
      fx.flash = Math.max(fx.flash, (.25 + .35 * nod) * w)
    } else {
      // BOB rocks gently while thinking
      o.rz += Math.sin(tw * 1.1) * .03 * focus
    }
    if (result > 0) cheer(fp, result, o, d, fx, w)
    return o
  }

  /* ── idle habits ─────────────────────────────────────────────── */

  const runFidget = (now: number, b: Pose, d: Pose, w: number) => {
    if (!fidget) {
      if (w > .95 && !gesture && now > nextFidget) {
        const pool = P.fidgets.filter(f => f !== lastFidget)
        const kind = pool[Math.floor(Math.random() * pool.length)]
        fidget = { kind, start: now, dur: FIDGET_MS[kind], dir: Math.random() < .5 ? -1 : 1 }
        lastFidget = kind
        if (kind === 'peek') blinkAt = Math.min(blinkAt, now + 80)
      }
      return
    }
    const p = (now - fidget.start) / fidget.dur
    if (p >= 1 || w < .05) { fidget = null; nextFidget = now + 2400 + Math.random() * 4200; return }
    const s = fidget.dir
    switch (fidget.kind) {
      case 'hop': { // crouch, jump, land, settle
        const squash = keys(p, [[0, 0], [.14, -.12], [.24, .1], [.5, .04], [.62, -.1], [.74, .03], [.86, 0]])
        d.sy += squash * w; d.sx -= squash * .5 * w
        d.y += arc((p - .18) / .44) * .32 * w
        b.happy += swell(p, .2, .4) * .6 * w
        break
      }
      case 'peek': { // glance one way, then the other
        const v = keys(p, [[0, 0], [.12, -1], [.4, -1], [.52, 1], [.8, 1], [1, 0]]) * s
        b.lookX += v * .95 * w; b.ry += v * .22 * w; b.rz -= v * .04 * w
        break
      }
      case 'wiggle': { // a happy little shimmy
        const e = swell(p, .15, .25) * w
        d.rz += Math.sin(p * TAU * 3) * .16 * e * swell(p, .1, .2)
        b.happy += e; d.y += arc(p) * .06 * w
        break
      }
      case 'tilt': { // curious, looking up and over
        const e = swell(p, .25, .35) * w
        b.rz += .22 * s * e; b.lookY += .45 * e; b.lookX -= .3 * s * e
        break
      }
      case 'yawn': { // eyes droop, a long slow stretch
        const e = swell(p, .3, .35) * w
        b.eye -= .55 * e; b.sy += .1 * e; b.sx -= .05 * e; b.rx -= .12 * e
        break
      }
      case 'bounce': { // two jelly bounces
        d.y += (arc(p / .45) * .14 + arc((p - .5) / .38) * .08) * w
        d.sy += (arc(p / .45) * .05 - land(p, .45) * .09 - land(p, .88) * .06) * w
        break
      }
      case 'spin': { // a hop and a twirl
        d.y += arc(p / .6) * .18 * w
        if (spinAt < 0 && p < .2 && w > .5) spinAt = now
        b.happy += swell((p - .5) / .5, .3, .4) * w
        break
      }
      case 'groove': { // MAX nods along to the music
        const e = swell(p, .1, .2) * w
        d.rx += tap(p * 6) * .1 * e; d.rz += Math.sin(p * Math.PI * 6) * .05 * e; d.y += tap(p * 6) * .015 * e
        b.happy += .8 * e
        break
      }
      case 'shimmy': { // NOVA shimmies, happy, with a small pin reaction
        const e = swell(p, .1, .3) * w
        d.rz += Math.sin(p * TAU * 2.5) * .1 * e * swell(p, .1, .2)
        b.happy += .8 * e; b.lookX += .5 * e; b.lookY += .5 * e
        break
      }
    }
  }

  /* ── one-off gestures ────────────────────────────────────────── */

  const applyGesture = (g: MateGesture, p: number, b: Pose, d: Pose, fx: Fx) => {
    if (g === 'orbit') { fx.spin += inOut(p) * TAU; return }
    if (g === 'ping') { // crouch, spring up wide-eyed, land
      const squash = keys(p, [[0, 0], [.18, -.13], [.36, .1], [.56, 0], [.62, 0], [.74, -.09], [.92, 0]])
      d.y += keys(p, [[0, 0], [.18, 0], [.42, .4], [.66, 0], [1, 0]])
      d.sy += squash; d.sx -= squash * .5
      const e = swell(p, .2, .5)
      fx.zoom += .2 * e; b.lookY += .4 * e
    }
    if (g === 'wave') { // no hands, so a hello shimmy with happy eyes
      const e = swell(p, .2, .25)
      d.rz += Math.sin(clamp((p - .1) / .8) * TAU * 3) * .18 * e * swell((p - .1) / .8, .15, .15)
      b.happy += e; b.rz -= .05 * e
      d.y += arc(p / .5) * .08
    }
  }

  return {
    setMode(next: MateBehavior, now: number) {
      if (mode === next) return
      if (mode === 'sleeping' && next !== 'sleeping') wakingStart = now
      if (mode === 'working' && next === 'awake' && now - workStart > 700) doneStart = now
      if (next === 'working') workStart = now
      // going to sleep softly lets go of whatever it was doing instead of freezing mid-move
      if (next === 'sleeping' && gesture && gesture !== 'orbit' && cancelAt < 0) cancelAt = now
      mode = next
    },
    gesture(next: MateGesture, now: number, reduce: boolean) {
      if (next === 'orbit' && reduce) { orbit360 += Math.PI / 2; return }
      if (next === 'stretch') wakingStart = now
      gesture = next
      gestureStart = now
      cancelAt = -1
    },
    finishGesture() { if (gesture && gesture !== 'orbit' && cancelAt < 0) cancelAt = performance.now() },
    reset() { orbit360 = 0; gesture = null; cancelAt = -1; spinAt = -1 },
    update(now: number, reduce: boolean, pointer?: { x: number; y: number }) {
      const dt = Math.min(.1, Math.max(0, (now - previous) / 1000))
      previous = now
      frameNow = now
      const live = !reduce
      const snap = reduce || !initialized
      const t = live ? (now - start) / 1000 : 0
      const tw = live ? Math.max(0, (now - workStart) / 1000) : 0

      // 1 · behaviours cross-fade instead of cutting
      for (const m of MODES) {
        const goal = m === mode ? 1 : 0
        if (snap) { weight[m] = goal; weightVel[m] = 0 } else follow(weight, weightVel, m, goal, 5.5, dt)
      }
      const total = MODES.reduce((sum, m) => sum + Math.max(0, weight[m]), 0) || 1
      const ws = Math.max(0, weight.sleeping) / total, wa = Math.max(0, weight.awake) / total, ww = Math.max(0, weight.working) / total

      // the cursor, eased; attention fades in and out
      const attention = pointer && live ? 1 : 0
      if (snap) { aim.on = attention; aimVel.on = 0 } else follow(aim, aimVel, 'on', attention, 5, dt)
      if (pointer) {
        if (snap) { aim.x = pointer.x; aim.y = pointer.y } else { follow(aim, aimVel, 'x', pointer.x, 9, dt); follow(aim, aimVel, 'y', pointer.y, 9, dt) }
      }

      // 2 · each behaviour's pose, blended
      const b: Pose = { ...ZERO }, d: Pose = { ...ZERO }
      const fx: Fx = { spin: 0, zoom: 0, flash: 0, burst: 0, pulse: 0 }
      if (ws > 0) addScaled(b, sleepPose(t), ws)
      if (wa > 0) addScaled(b, idlePose(t), wa)
      if (ww > 0) addScaled(b, workPose(t, tw, d, fx, ww), ww)
      const looking = aim.on * (wa + ww * .3)
      b.lookX = lerp(b.lookX, aim.x * 1.1, looking)
      b.lookY = lerp(b.lookY, -aim.y * .9, looking)
      b.ry += aim.x * .18 * aim.on * wa
      b.rx += aim.y * .08 * aim.on * wa

      // 3 · habits, gestures, waking up, the end-of-work beat
      if (snap) { habit.gain = gesture ? 0 : 1; habitVel.gain = 0 } else follow(habit, habitVel, 'gain', gesture ? 0 : 1, 9, dt)
      if (live) runFidget(now, b, d, wa * (1 - aim.on) * habit.gain)
      if (gesture) {
        // a cancelled gesture fades out over a quarter second rather than vanishing
        const keep = cancelAt < 0 ? 1 : snap ? 0 : 1 - smooth((now - cancelAt) / 250)
        const p = reduce ? .45 : Math.min(1, (now - gestureStart) / DURATION[gesture])
        const gb: Pose = { ...ZERO }, gd: Pose = { ...ZERO }, gfx: Fx = { spin: 0, zoom: 0, flash: 0, burst: 0, pulse: 0 }
        applyGesture(gesture, p, gb, gd, gfx)
        addScaled(b, gb, keep); addScaled(d, gd, keep)
        fx.spin += gfx.spin; fx.zoom += gfx.zoom * keep
        if (p >= 1 || keep <= 0) { gesture = null; cancelAt = -1 }
      }
      // the stretch on waking, and the beat after work, both melt away if it falls back asleep
      const awakeShare = 1 - ws
      const waking = live && mode !== 'sleeping' && now - wakingStart < DURATION.stretch
      let eyeHold = 1
      if (live && now - wakingStart < DURATION.stretch) {
        // eyes open, a long stretch, then a pop up into the air
        const p = (now - wakingStart) / DURATION.stretch, e = swell(p, .35, .35) * awakeShare
        b.sy += .16 * e; b.sx -= .08 * e; b.rx -= .1 * e; b.lookY += .3 * e
        d.y += arc((p - .55) / .4) * .12 * awakeShare
        eyeHold = lerp(1, keys(p, [[0, .08], [.13, .08], [.2, 1], [.3, 1], [.33, .15], [.37, 1], [1, 1]]), awakeShare)
      }
      if (live && now - doneStart < DONE_MS) cheer((now - doneStart) / DONE_MS, swell((now - doneStart) / DONE_MS, .15, .35) * awakeShare, b, d, fx, awakeShare)
      if (spinAt >= 0) {
        const sp = (now - spinAt) / SPIN_MS
        if (sp >= 1 || !live) spinAt = -1
        else fx.spin += inOut(sp) * TAU
      }
      if (live && now - start < ENTER_MS) fx.spin -= (1 - backOut((now - start) / ENTER_MS)) * (Math.PI / 2)

      // 4 · springs carry the slow pose; the fast details ride on top
      for (const c of CHANNELS) {
        if (snap) { pose[c] = b[c]; vel[c] = 0 } else follow(pose, vel, c, b[c], STIFF[c], dt)
      }
      initialized = true

      const sx = pose.sx + d.sx, sy = pose.sy + d.sy
      rig.position.set(pose.x + d.x, pose.y + d.y, 0)
      rig.rotation.set(0, baseYaw + orbit360 + fx.spin, 0)
      // squash and stretch from the bottom, so landings look like landings
      bodyNode.position.y = C + (sy - 1) * H
      bodyNode.rotation.set(pose.rx + d.rx, pose.ry + d.ry, pose.rz + d.rz)
      bodyNode.scale.set(sx, sy, sx)
      const lookX = clamp(pose.lookX + d.lookX, -1.2, 1.2), lookY = clamp(pose.lookY + d.lookY, -1, 1)
      face.position.set(lookX * .075, lookY * .055, 0)

      // 5 · face: dot eyes; mostly-closed eyes become a drawn line (∪), happy ones an arc (∩)
      const closed = live && ws < .5 ? blinkAmount(now) : 0
      const open = clamp(pose.eye * eyeHold * (1 - .94 * closed) + d.eye, .05, 1.35)
      const glad = smooth(clamp(pose.happy + d.happy))
      const lid = smooth((.55 - open) / .4) * (1 - glad)
      const zoom = 1 + fx.zoom
      eyes.forEach(({ bead, happy, shut, bead0 }) => {
        const dot = (1 - glad) * (1 - lid)
        bead.scale.set(bead0.x * zoom * (.4 + .6 * dot), Math.max(.002, bead0.y * open * zoom * dot), bead0.z)
        happy.scale.setScalar(Math.max(.001, glad))
        shut.scale.setScalar(Math.max(.001, lid))
        if (options.hideInactiveEyes) {
          // Skip subpixel expression meshes in the live viewer. Offline renders
          // keep the full rig; visible expressions and their crossfades are intact.
          happy.visible = glad > .005
          shut.visible = lid > .005
        }
      })

      // 6 · the orbiting dots
      if (live) orbitAngle += dt * (1.7 + fx.pulse * .6)
      orbit.rotation.y = orbitAngle
      const on = clamp(pose.dots)
      orbitDots.forEach((m, i) => {
        const a = (i * TAU) / 3, wave = Math.sin(t * 5.5 - i * 1.1)
        const reach = 1.35 + fx.burst * .9
        m.position.set(Math.cos(a) * reach, wave * .09 * on, Math.sin(a) * reach)
        const size = on * (1 - fx.burst * .85) * (.85 + .15 * wave)
        m.scale.setScalar(Math.max(.001, size))
        m.visible = size > .01
      })
      if (dotMat instanceof MeshStandardMaterial) dotMat.emissiveIntensity = .35 + fx.flash * .8 + fx.pulse * .2
      else dotMat.color.copy(dotTint).multiplyScalar(1 + fx.flash * .15 + fx.pulse * .04)

      // 7 · secondary motion: accessories and tufts lag behind, then wobble back
      const tiltX = bodyNode.rotation.x, tiltZ = bodyNode.rotation.z, lift = rig.position.y + bodyNode.position.y
      if (snap) wobblers.forEach(o => { o.ax = o.az = o.vx = o.vz = 0 })
      else {
        const dX = tiltX - last.tiltX, dZ = tiltZ - last.tiltZ, dL = lift - last.lift
        const steps = Math.max(1, Math.ceil(dt * 120)), h = dt / steps
        for (const o of wobblers) {
          o.ax -= dX * 1.2 + dL * 2.5
          o.az -= dZ * 1.2
          for (let i = 0; i < steps; i++) {
            o.vx += (-150 * o.ax - 4.5 * o.vx) * h; o.ax += o.vx * h
            o.vz += (-150 * o.az - 4.5 * o.vz) * h; o.az += o.vz * h
          }
          o.ax = clamp(o.ax, -o.limit, o.limit); o.az = clamp(o.az, -o.limit, o.limit)
        }
      }
      last = { tiltX, tiltZ, lift }
      wobblers.forEach(o => {
        o.node.rotation.set(o.x0 + o.ax, o.y0, o.z0 + o.az)
        if (o.node.name === 'hat') seatMateHat(o.node)
      })

      // 8 · contact shadow: smaller and darker the closer the dot is to the floor
      const bottom = rig.position.y + bodyNode.position.y - H * sy
      const height = clamp(bottom / 1.2)
      const size = H * (1.25 - .45 * height) * sx
      shadow.position.set(rig.position.x, .004, 0)
      shadow.scale.set(size, size, 1)
      shadowMat.opacity = .95 - .55 * height

      return { state: waking ? 'waking' as const : mode, gesture, transitioning: waking, poseSettling: mode === 'sleeping' && Math.abs(pose.y - b.y) > .01 }
    },
    get mode() { return mode },
  }
}
