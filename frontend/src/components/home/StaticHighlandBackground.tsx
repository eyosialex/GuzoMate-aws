import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Static Highland Background
 * Replicates the landing page's 3D wireframe highland terrain & AI neural core
 * strictly WITHOUT animation or mouse ripple calculations.
 */
export const StaticHighlandBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfafaf4, 0.035);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );
    camera.position.set(0, 5, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: 'high-performance' 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const emeraldLight = new THREE.PointLight(0x1b4332, 10, 35);
    emeraldLight.position.set(6, 9, 6);
    scene.add(emeraldLight);

    const amberLight = new THREE.PointLight(0xd97706, 8, 35);
    amberLight.position.set(-7, 7, 5);
    scene.add(amberLight);

    // 3. 3D Mountain Terrain Mesh covering the screen
    const terrainGeo = new THREE.PlaneGeometry(64, 64, 84, 84);
    terrainGeo.rotateX(-Math.PI * 0.36);

    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      const elevation =
        Math.sin(x * 0.3) * Math.cos(z * 0.3) * 1.8 +
        Math.sin(x * 0.6 + 1.2) * 0.9 +
        (dist > 7 ? (dist - 7) * 0.25 : 0);
      posAttr.setY(i, elevation);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x1b4332,
      wireframe: true,
      roughness: 0.5,
      metalness: 0.25,
      transparent: true,
      opacity: 0.5,
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.set(0, -1.5, -4);
    scene.add(terrainMesh);

    // Static Single-Frame Render (No requestAnimationFrame animation loop)
    renderer.render(scene, camera);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.render(scene, camera);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    />
  );
};
