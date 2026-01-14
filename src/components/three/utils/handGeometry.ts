import * as THREE from 'three';

export function createHandGeometry() {
  const handGroup = new THREE.Group();
  const material = new THREE.MeshPhongMaterial({ color: 0xffdbac });

  // Palm
  const palmGeometry = new THREE.BoxGeometry(1, 1.2, 0.3);
  const palm = new THREE.Mesh(palmGeometry, material);
  handGroup.add(palm);

  // Fingers
  const fingerGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(fingerGeometry, material);
    finger.position.y = 0.8;
    finger.position.x = -0.3 + (i * 0.2);
    handGroup.add(finger);
  }

  // Thumb
  const thumbGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.2);
  const thumb = new THREE.Mesh(thumbGeometry, material);
  thumb.position.set(-0.5, 0.2, 0);
  thumb.rotation.z = -0.5;
  handGroup.add(thumb);

  return handGroup;
}