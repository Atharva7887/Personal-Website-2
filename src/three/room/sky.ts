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
}

export const SKY_DAY: SkyLook = { zenith: '#a9bddd', horizon: '#eef1f5', glow: '#fff6e0', below: '#e4e7ec', sunSize: 0.035, glowSize: 0.35 }
export const SKY_SUNSET: SkyLook = { zenith: '#161a3d', horizon: '#ff8f5a', glow: '#ffd08a', below: '#0b0d1a', sunSize: 0.06, glowSize: 0.7 }

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
varying vec3 vDir;
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
    },
    /** Keeps the dome centred on the camera so it never gets closer or clipped. */
    follow(camera: THREE.Camera) {
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
    fade: { value: new THREE.Vector2(14, radius * 0.9) },
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
        float d = length(vXZ - vec2(-4.0, 0.0));
        gl_FragColor = vec4(mix(ground, horizon, smoothstep(fade.x, fade.y, d)), 1.0);
        #include <colorspace_fragment>
      }`,
  })
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(-4, -0.3, 0)
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
