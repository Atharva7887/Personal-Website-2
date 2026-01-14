import * as THREE from 'three';

export function setupLighting(scene: THREE.Scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  
  directionalLight.position.set(5, 5, 5);
  
  scene.add(ambientLight);
  scene.add(directionalLight);
}