import * as THREE from 'three';

export function setupScene(container: HTMLElement, width: number, height: number) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ 
    alpha: true, 
    antialias: true 
  });
  
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  return { scene, camera, renderer };
}