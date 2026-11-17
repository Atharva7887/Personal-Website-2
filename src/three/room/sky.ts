import * as THREE from 'three'

// The sky: a gradient dome with a sun in it. Day is a pale blue sky and a bright sun; night is a sunset
// (Pune evening) with the sun sitting on the horizon. Below the horizon it fades to the page colour, so the
// room still floats on the page when seen from above.

export interface SkyLook {
  zenith: string
  horizon: string
  glow: string // around the sun
  below: string // the page colour
  sunSize: number // angular radius of the disc, radians
  glowSize: number
  cloudLit: string // cloud tops, facing the sun
  cloudShade: string // cloud undersides
  cover: number // 0 clear .. 1 overcast
}

export const SKY_DAY: SkyLook = {
  zenith: '#5f8fd6',
  horizon: '#dde7f2',
  glow: '#fff6e0',
  below: '#e4e7ec',
  sunSize: 0.045,
  glowSize: 0.45,
  cloudLit: '#ffffff',
  cloudShade: '#a9b6cb',
  cover: 0.5,
}
export const SKY_SUNSET: SkyLook = {
  zenith: '#161a3d',
  horizon: '#ff8f5a',
  glow: '#ffd08a',
  below: '#0b0d1a',
  sunSize: 0.06,
  glowSize: 0.7,
  cloudLit: '#ffb48a',
  cloudShade: '#3b2c4f',
  cover: 0.55,
}

const vert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * p;
  gl_Position.z = gl_Position.w; // always at the far end of the depth range
}`

const frag = /* glsl */ `
uniform vec3 zenith;
uniform vec3 horizon;
uniform vec3 glow;
uniform vec3 below;
uniform vec3 sunDir;
uniform float sunSize;
uniform float glowSize;
uniform float warm; // 0 day, 1 sunset: how far the horizon colour climbs
uniform vec3 cloudLit;
uniform vec3 cloudShade;
uniform float cover;
uniform float time;
varying vec3 vDir;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  // Above the horizon: horizon colour rising into the zenith (a sunset keeps more of its warm band).
  float up = pow(clamp(h, 0.0, 1.0), mix(0.55, 0.35, warm));
  vec3 col = mix(horizon, zenith, up);
  // A purple band between the warm horizon and the deep sky at sunset.
  col = mix(col, mix(horizon, zenith, 0.5) * vec3(0.9, 0.62, 0.95), warm * smoothstep(0.02, 0.15, h) * (1.0 - smoothstep(0.15, 0.45, h)) * 0.6);
  // The sun's glow, stronger near the horizon.
  float a = acos(clamp(dot(d, normalize(sunDir)), -1.0, 1.0));
  col = mix(col, glow, smoothstep(glowSize, 0.0, a) * 0.75);
  // The disc, with a soft edge.
  col = mix(col, vec3(1.0, 0.97, 0.9), smoothstep(sunSize, sunSize * 0.8, a));
  // Clouds: a layer overhead, seen in perspective, drifting slowly. Lit on the side towards the sun.
  if (h > 0.0) {
    vec2 uv = d.xz / (h + 0.18) * 1.6 + vec2(time * 0.012, time * 0.004);
    float n = fbm(uv);
    float c = smoothstep(1.0 - cover, 1.0 - cover + 0.18, n) * smoothstep(0.0, 0.1, h);
    float lit = clamp(0.5 + 0.5 * dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(sunDir.x, 0.0, sunDir.z))), 0.0, 1.0);
    float thick = smoothstep(0.45, 0.95, n);
    vec3 cc = mix(cloudLit, cloudShade, thick * (1.0 - 0.6 * lit));
    cc = mix(cc, glow, smoothstep(glowSize * 1.4, 0.0, a) * 0.6); // rims catch the sun's glow
    col = mix(col, cc, c * 0.92);
  }
  // Below the horizon: fade quickly to the page colour.
  col = mix(below, col, smoothstep(-0.12, 0.02, h));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`

export function buildSky(radius: number) {
  const uniforms = {
    zenith: { value: new THREE.Color() },
    horizon: { value: new THREE.Color() },
    glow: { value: new THREE.Color() },
    below: { value: new THREE.Color() },
    sunDir: { value: new THREE.Vector3(-1, 0.3, 0.2) },
    sunSize: { value: 0.04 },
    glowSize: { value: 0.4 },
    warm: { value: 0 },
    cloudLit: { value: new THREE.Color() },
    cloudShade: { value: new THREE.Color() },
    cover: { value: 0.4 },
    time: { value: 0 },
  }
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag, side: THREE.BackSide, depthWrite: false, fog: false })
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), mat)
  mesh.renderOrder = -1
  mesh.frustumCulled = false
  mesh.raycast = () => {}
  return {
    mesh,
    set(look: SkyLook, sunDir: THREE.Vector3, warm: number) {
      uniforms.zenith.value.set(look.zenith)
      uniforms.horizon.value.set(look.horizon)
      uniforms.glow.value.set(look.glow)
      uniforms.below.value.set(look.below)
      uniforms.sunSize.value = look.sunSize
      uniforms.glowSize.value = look.glowSize
      uniforms.sunDir.value.copy(sunDir).normalize()
      uniforms.warm.value = warm
      uniforms.cloudLit.value.set(look.cloudLit)
      uniforms.cloudShade.value.set(look.cloudShade)
      uniforms.cover.value = look.cover
    },
    tick(t: number) {
      uniforms.time.value = t
    },
    /** Keeps the dome centred on the camera so it never gets closer or clipped. */
    follow(camera: THREE.Object3D) {
      mesh.position.copy(camera.position)
    },
    dispose() {
      mesh.geometry.dispose()
      mat.dispose()
    },
  }
}

/**
 * Distant ground for eye-level views: fields that fade into the horizon colour, so walking to the fence
 * doesn't look out over the empty page. Hidden from above, where the room floats on the page.
 */
export function buildGround(radius: number) {
  const uniforms = {
    ground: { value: new THREE.Color('#9fb489') },
    horizon: { value: new THREE.Color('#eef1f5') },
    fade: { value: new THREE.Vector2(19, radius * 0.9) },
  }
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vXZ;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vXZ = w.xz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 ground;
      uniform vec3 horizon;
      uniform vec2 fade;
      varying vec2 vXZ;
      void main() {
        float d = length(vXZ - vec2(-6.0, 0.0));
        gl_FragColor = vec4(mix(ground, horizon, smoothstep(fade.x, fade.y, d)), 1.0);
        #include <colorspace_fragment>
      }`,
  })
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(-6, -0.3, 0)
  mesh.raycast = () => {}
  mesh.visible = false
  return {
    mesh,
    set(ground: string, horizon: string) {
      uniforms.ground.value.set(ground)
      uniforms.horizon.value.set(horizon)
    },
    dispose() {
      mesh.geometry.dispose()
      mat.dispose()
    },
  }
}
