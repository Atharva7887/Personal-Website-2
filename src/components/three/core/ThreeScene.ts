import * as THREE from 'three';

export class ThreeScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  constructor(container: HTMLElement) {
    // Scene setup
    this.scene = new THREE.Scene();
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Handle resize
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public add(object: THREE.Object3D) {
    this.scene.add(object);
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
  }

  public get nativeScene() {
    return this.scene;
  }

  public get nativeCamera() {
    return this.camera;
  }

  public get nativeRenderer() {
    return this.renderer;
  }
}