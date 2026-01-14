import { useEffect, useRef } from 'react';
import { ThreeScene } from '../components/three/core/ThreeScene';
import { IcosahedronObject } from '../components/three/objects/IcosahedronObject';
import { SceneLights } from '../components/three/lights/SceneLights';

export function useThreeAnimation(containerRef: React.RefObject<HTMLDivElement>) {
  const sceneRef = useRef<ThreeScene | null>(null);
  const icosahedronRef = useRef<IcosahedronObject | null>(null);
  const lightsRef = useRef<SceneLights | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scene
    const scene = new ThreeScene(containerRef.current);
    sceneRef.current = scene;

    // Create and add icosahedron
    const icosahedron = new IcosahedronObject();
    icosahedronRef.current = icosahedron;
    scene.add(icosahedron.object);

    // Add lights
    const lights = new SceneLights();
    lightsRef.current = lights;
    lights.addToScene(scene.nativeScene);

    // Handle mouse movement
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      if (icosahedronRef.current) {
        icosahedronRef.current.updateTargetPosition(x, y);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (icosahedronRef.current) {
        icosahedronRef.current.update();
      }
      scene.render();
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (icosahedronRef.current) icosahedronRef.current.dispose();
      if (lightsRef.current) lightsRef.current.dispose();
      if (sceneRef.current) sceneRef.current.dispose();
    };
  }, [containerRef]);
}