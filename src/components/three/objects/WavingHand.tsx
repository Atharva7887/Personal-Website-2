import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createHandGeometry } from '../utils/handGeometry';
import { setupLighting } from '../utils/lighting';
import { setupScene } from '../utils/sceneSetup';

export default function WavingHand() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const { scene, camera, renderer } = setupScene(containerRef.current, 200, 200);
    const handGroup = createHandGeometry();
    setupLighting(scene);
    
    scene.add(handGroup);
    camera.position.z = 5;

    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.05;
      handGroup.rotation.z = Math.sin(time) * 0.3;
      handGroup.rotation.y = Math.sin(time * 0.5) * 0.2;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-[200px] h-[200px] mx-auto"
      aria-label="3D waving hand animation"
    />
  );
}