import * as THREE from 'three';

export class SceneLights {
  private lights: THREE.Light[] = [];

  constructor() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.lights.push(ambientLight);

    // Point light
    const pointLight = new THREE.PointLight(0x8b5cf6, 1);
    pointLight.position.set(5, 5, 5);
    this.lights.push(pointLight);
  }

  public addToScene(scene: THREE.Scene) {
    this.lights.forEach(light => scene.add(light));
  }

  public dispose() {
    this.lights.forEach(light => {
      if (light.parent) {
        light.parent.remove(light);
      }
    });
  }
}