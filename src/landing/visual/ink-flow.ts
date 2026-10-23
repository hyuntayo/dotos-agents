/** Original smoked-glass refraction; pointer light and scroll-driven advection. */
const VERTEX = `
attribute vec2 a_position;
varying vec2 v_uv;
void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}
`
const FRAGMENT = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_texture;
uniform vec2 u_cover;
uniform float u_time;
uniform float u_scroll;
uniform vec2 u_motion;
uniform vec3 u_pointer;
uniform float u_aspect;
float seed(vec2 p){return fract(sin(p.x*91.345+p.y*64.123)*157.31);}
float field(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(seed(i),seed(i+vec2(1.,0.)),f.x),mix(seed(i+vec2(0.,1.)),seed(i+vec2(1.,1.)),f.x),f.y);
}
void main(){
  vec2 uv=v_uv;
  float t=u_time*.13;
  float travel=u_motion.x;
  float wake=u_motion.y;
  float a=field(uv*2.8+vec2(t*.32+travel*.17,-t*.24-travel*.29));
  float b=field(uv*3.6+vec2(-t*.21,t*.3)+a*.8+travel*.13);
  vec2 delta=uv-u_pointer.xy;
  vec2 brush_space=delta*vec2(u_aspect,1.)+vec2(a-.5,b-.5)*.22;
  float brush=exp(-dot(brush_space,brush_space)*2.5)*u_pointer.z;
  vec2 drag=delta*brush*.14;
  vec2 drift=vec2(a-.5,b-.5)*(.10+abs(wake)*.025)+drag;
  vec2 pan=vec2(sin(travel*.37)*.026,cos(travel*.29)*.035);
  float angle=sin(travel*.31)*.035;
  mat2 turn=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
  vec2 surface=turn*(uv-.5)*(.82-.035*sin(u_scroll*3.14159));
  vec2 sample_uv=(surface+drift+pan)*u_cover+.5;
  vec3 pigment=texture2D(u_texture,clamp(sample_uv,vec2(.001),vec2(.999))).rgb;
  float light=.5+.5*sin(a*5.8+b*3.4-t*.9+travel*.6);
  float relief=pow(clamp(1.-abs(a-b)*1.8,0.,1.),3.);
  float edges=smoothstep(.04,.48,abs(uv.x-.5));
  vec3 reflection=mix(vec3(.055,.12,.27),vec3(.055,.16,.135),smoothstep(.15,.52,u_scroll));
  reflection=mix(reflection,vec3(.20,.105,.14),smoothstep(.58,.83,u_scroll));
  reflection=mix(reflection,vec3(.075,.12,.245),smoothstep(.84,1.,u_scroll));
  float sheen=(light*.18+brush*(.22+relief*.30)+abs(wake)*.16)*(.30+edges*.70);
  vec3 color=pigment*(.70+light*.48+brush*.42)+reflection*sheen;
  gl_FragColor=vec4(color,1.);
}
`

export type InkFlow = {
  start: () => void
  pause: () => void
  setImage: (image: HTMLImageElement) => void
  setProgress: (progress: number, travel?: number) => void
  setPointer: (x: number, y: number, engaged: boolean) => void
  dispose: () => void
}

export function createInkFlow(canvas: HTMLCanvasElement, image: HTMLImageElement, onFrame: () => void, onLost: () => void): InkFlow | null {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false })
  if (!gl) return null
  const shaders: WebGLShader[] = []
  let program: WebGLProgram | null = null, buffer: WebGLBuffer | null = null, texture: WebGLTexture | null = null
  let frame = 0, elapsed = 0, lastTime = 0, lastPaint = 0, running = false, disposed = false, lost = false
  let source = image, progress = 0, targetProgress = 0, travel = 0, targetTravel = 0, wake = 0, rate = 24, shown = false
  const pointer = { x: .5, y: .5, strength: 0 }, targetPointer = { ...pointer }
  let observer: ResizeObserver | undefined, removeContextListener: (() => void) | undefined
  const pause = () => { running = false; cancelAnimationFrame(frame); lastTime = 0 }
  const cleanup = () => {
    observer?.disconnect(); removeContextListener?.()
    if (texture) gl.deleteTexture(texture)
    if (buffer) gl.deleteBuffer(buffer)
    if (program) gl.deleteProgram(program)
    for (const shader of shaders) gl.deleteShader(shader)
  }
  const compile = (kind: number, text: string) => {
    const shader = gl.createShader(kind)
    if (!shader) throw Error('Shader unavailable')
    shaders.push(shader); gl.shaderSource(shader, text); gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error('Shader unsupported')
    return shader
  }
  try {
    program = gl.createProgram()
    if (!program) throw Error('Renderer unavailable')
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX))
    const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)?.precision
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, precision ? FRAGMENT : FRAGMENT.replace('precision highp', 'precision mediump')))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Renderer unsupported')
    gl.useProgram(program)
    buffer = gl.createBuffer()
    if (!buffer) throw Error('Renderer unavailable')
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    texture = gl.createTexture()
    if (!texture) throw Error('Texture unavailable')
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0)
    const timeUniform = gl.getUniformLocation(program, 'u_time'), scrollUniform = gl.getUniformLocation(program, 'u_scroll'), coverUniform = gl.getUniformLocation(program, 'u_cover')
    const motionUniform = gl.getUniformLocation(program, 'u_motion'), pointerUniform = gl.getUniformLocation(program, 'u_pointer'), aspectUniform = gl.getUniformLocation(program, 'u_aspect')
    const paint = () => {
      gl.uniform1f(timeUniform, elapsed); gl.uniform1f(scrollUniform, progress)
      gl.uniform2f(motionUniform, travel, wake); gl.uniform3f(pointerUniform, pointer.x, pointer.y, pointer.strength)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }
    const resize = () => {
      if (disposed || lost) return
      const host = canvas.parentElement!
      const width = host.clientWidth, height = host.clientHeight
      const phone = innerWidth <= 760
      const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
      const lowPower = device.connection?.saveData || (device.deviceMemory !== undefined && device.deviceMemory <= 4)
      const budget = lowPower ? 128000 : phone ? 220000 : 480000
      const scale = Math.min(.6, Math.sqrt(budget / Math.max(1, width * height)))
      canvas.width = Math.max(1, Math.floor(width * scale)); canvas.height = Math.max(1, Math.floor(height * scale))
      gl.viewport(0, 0, canvas.width, canvas.height)
      const imageRatio = source.naturalWidth / source.naturalHeight, hostRatio = width / height
      gl.uniform2f(coverUniform, Math.min(1, hostRatio / imageRatio), Math.min(1, imageRatio / hostRatio))
      gl.uniform1f(aspectUniform, Math.min(2.2, Math.max(.65, hostRatio)))
      rate = lowPower ? 12 : phone ? 18 : 24
      if (shown) paint()
    }
    const setImage = (next: HTMLImageElement) => {
      if (disposed || lost || !next.complete || !next.naturalWidth) return
      source = next
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
      resize()
    }
    const draw = (now: number) => {
      if (!running || disposed || lost) return
      const dt = lastTime ? Math.min(.1, (now - lastTime) / 1000) : 0
      elapsed += dt
      lastTime = now
      const follow = 1 - Math.exp(-dt * 7)
      const disturbance = Math.max(-1, Math.min(1, (targetTravel - travel) * 2.2))
      progress += (targetProgress - progress) * follow
      travel += (targetTravel - travel) * follow
      wake += (disturbance - wake) * follow
      pointer.x += (targetPointer.x - pointer.x) * follow
      pointer.y += (targetPointer.y - pointer.y) * follow
      pointer.strength += (targetPointer.strength - pointer.strength) * follow
      if (now - lastPaint >= 1000 / rate) {
        paint(); lastPaint = now
        if (!shown) { shown = true; onFrame() }
      }
      frame = requestAnimationFrame(draw)
    }
    const contextLost = (event: Event) => { event.preventDefault(); lost = true; pause(); onLost() }
    canvas.addEventListener('webglcontextlost', contextLost)
    removeContextListener = () => canvas.removeEventListener('webglcontextlost', contextLost)
    observer = new ResizeObserver(resize)
    observer.observe(canvas.parentElement!)
    setImage(image)
    return {
      start: () => { if (!running && !disposed && !lost) { running = true; lastTime = 0; frame = requestAnimationFrame(draw) } },
      pause, setImage,
      setProgress: (next, distance = next * 12) => {
        if (Number.isFinite(next)) targetProgress = Math.max(0, Math.min(1, next))
        if (Number.isFinite(distance)) targetTravel = Math.max(0, distance)
      },
      setPointer: (x, y, engaged) => {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return
        targetPointer.x = .5 + Math.max(-1, Math.min(1, x)) * .5
        targetPointer.y = .5 - Math.max(-1, Math.min(1, y)) * .5
        targetPointer.strength = engaged ? 1 : 0
      },
      dispose: () => { disposed = true; pause(); cleanup(); if (!lost) gl.getExtension('WEBGL_lose_context')?.loseContext() },
    }
  } catch { pause(); cleanup(); return null }
}
