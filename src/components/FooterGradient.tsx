import { ShaderChunk } from 'three'
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react'

// shadergradient's shaders still #include a chunk that three removed before 0.187, which stops the program
// compiling. Its lighting path is the 3D lights, not the environment lookup, so an empty chunk is enough.
const chunks = ShaderChunk as Record<string, string>
chunks.cube_uv_reflection_fragment ??= ''

/**
 * The WebGL half of the footer backdrop. Kept in its own file so it is only ever fetched through
 * React.lazy once the footer is near the viewport: the home page's first load never pays for it.
 * Palette is the site's own (ink, volt, a little voltsoft) with a touch of warm sand; speed is low
 * and the grain is off so it reads as slow light behind the type, not as a show.
 */
export default function FooterGradient() {
  return (
    <ShaderGradientCanvas
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      pixelDensity={1}
      pointerEvents="none"
      fov={45}
    >
      <ShaderGradient
        control="props"
        type="waterPlane"
        animate="on"
        uTime={0}
        uSpeed={0.12}
        uStrength={3.4}
        uDensity={1.1}
        uFrequency={5.5}
        uAmplitude={0}
        color1="#2f45ff"
        color2="#0c0f14"
        color3="#c9b79a"
        grain="off"
        lightType="3d"
        brightness={1.2}
        envPreset="city"
        reflection={0.05}
        cAzimuthAngle={170}
        cPolarAngle={70}
        cDistance={3.2}
        cameraZoom={9}
        positionX={0}
        positionY={0.9}
        positionZ={-0.3}
        rotationX={45}
        rotationY={0}
        rotationZ={0}
        range="disabled"
        wireframe={false}
        enableTransition={false}
      />
    </ShaderGradientCanvas>
  )
}
