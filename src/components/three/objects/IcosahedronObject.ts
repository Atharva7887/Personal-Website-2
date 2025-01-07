import * as THREE from 'three';

export class IcosahedronObject {
  private mesh: THREE.Mesh;
  private targetPosition = { x: 0, y: 0 };

  constructor() {
    const geometry = new THREE.IcosahedronGeometry(2, 0);
    const material = new THREE.MeshPhongMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, material);
  }

  public update() {
    // Constant rotation
    this.mesh.rotation.x += 0.002;
    this.mesh.rotation.y += 0.002;

    // Smooth movement towards target
    this.mesh.position.x += (this.targetPosition.x - this.mesh.position.x) * 0.05;
    this.mesh.position.y += (this.targetPosition.y - this.mesh.position.y) * 0.05;
  }

  public updateTargetPosition(x: number, y: number) {
    this.targetPosition = { x: x * 0.5, y: y * 0.5 };
  }

  public get object() {
    return this.mesh;
  }

  public dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}