import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { soundFX } from '../../lib/audioEffects';

export const ThreeDHighlandCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const rippleRef = useRef<{ x: number; y: number; time: number; active: boolean }>({
    x: 0,
    y: 0,
    time: 0,
    active: false,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfafaf4, 0.04);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 5.5, 11);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const emeraldLight = new THREE.PointLight(0x1b4332, 8, 25);
    emeraldLight.position.set(5, 8, 5);
    scene.add(emeraldLight);

    const amberLight = new THREE.PointLight(0xd97706, 6, 25);
    amberLight.position.set(-6, 6, 4);
    scene.add(amberLight);

    // 3. Interactive Procedural Mountain Terrain Mesh
    const terrainGeo = new THREE.PlaneGeometry(36, 36, 72, 72);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    const initialY = new Float32Array(posAttr.count);

    // Sculpt initial highland landscape with hills and valleys
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      // Valley in center, dramatic mountain ridges on sides
      const elevation =
        Math.sin(x * 0.35) * Math.cos(z * 0.35) * 1.5 +
        Math.sin(x * 0.7 + 1.2) * 0.8 +
        (dist > 5 ? (dist - 5) * 0.28 : 0);
      posAttr.setY(i, elevation);
      initialY[i] = elevation;
    }
    terrainGeo.computeVertexNormals();

    // Highland Modern Wireframe + Surface Material
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x1b4332,
      wireframe: true,
      roughness: 0.6,
      metalness: 0.2,
      transparent: true,
      opacity: 0.45,
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.set(0, -1.8, -2);
    scene.add(terrainMesh);

    // 4. Floating 3D Holographic AI Neural Core (Particle Sphere)
    const sphereGeo = new THREE.IcosahedronGeometry(1.8, 4);
    const sphereMat = new THREE.PointsMaterial({
      color: 0xd97706,
      size: 0.05,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const neuralSphere = new THREE.Points(sphereGeo, sphereMat);
    neuralSphere.position.set(0, 3.2, 0);
    scene.add(neuralSphere);

    // Inner glowing core
    const innerCoreGeo = new THREE.IcosahedronGeometry(0.9, 2);
    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    neuralSphere.add(innerCore);

    // 5. Glowing Neon Route Highway Vector Cutting Through Mountains
    const routeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-14, -0.6, -10),
      new THREE.Vector3(-6, -1.0, -4),
      new THREE.Vector3(0, -1.2, 1),
      new THREE.Vector3(5, -0.8, 5),
      new THREE.Vector3(12, -0.2, 9),
    ]);
    const routeGeo = new THREE.TubeGeometry(routeCurve, 64, 0.08, 8, false);
    const routeMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.9,
    });
    const routeMesh = new THREE.Mesh(routeGeo, routeMat);
    routeMesh.position.set(0, -1.75, -2);
    scene.add(routeMesh);

    // Traveling Energy Vehicle Pulse on Route
    const pulseGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      blending: THREE.AdditiveBlending,
    });
    const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
    scene.add(pulseMesh);

    // Mouse & Window Handlers
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleClick = (e: MouseEvent) => {
      soundFX.playRadarPing();
      rippleRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
        time: 0,
        active: true,
      };
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);

    // 6. Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera parallax easing
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      camera.position.x = mouseRef.current.x * 2.5;
      camera.position.y = 5.5 + mouseRef.current.y * 1.5;
      camera.lookAt(0, 0.5, 0);

      // Rotate and breathe AI Neural Core
      neuralSphere.rotation.y = elapsedTime * 0.4;
      neuralSphere.rotation.x = Math.sin(elapsedTime * 0.3) * 0.2;
      const sphereScale = 1 + Math.sin(elapsedTime * 2) * 0.08;
      neuralSphere.scale.set(sphereScale, sphereScale, sphereScale);
      innerCore.rotation.y = -elapsedTime * 0.8;

      // Animate Traveling Energy Pulse along Route
      const pulseProgress = (elapsedTime * 0.15) % 1;
      const pointOnCurve = routeCurve.getPoint(pulseProgress);
      pulseMesh.position.set(pointOnCurve.x, pointOnCurve.y - 1.75, pointOnCurve.z - 2);

      // Procedural Real-time Vertex Wave & Click Ripple on Terrain
      const positions = terrainGeo.attributes.position;
      const ripple = rippleRef.current;
      if (ripple.active) {
        ripple.time += 0.035;
        if (ripple.time > 3.0) ripple.active = false;
      }

      for (let i = 0; i < positions.count; i++) {
        const u = positions.getX(i);
        const w = positions.getZ(i);
        let dynamicY = initialY[i];

        // Organic undulating wave
        dynamicY += Math.sin(u * 0.5 + elapsedTime * 1.2) * Math.cos(w * 0.5 + elapsedTime * 0.8) * 0.25;

        // Interactive mouse displacement
        const dx = u - mouseRef.current.x * 10;
        const dz = w - (-mouseRef.current.y * 10);
        const distToMouse = Math.sqrt(dx * dx + dz * dz);
        if (distToMouse < 6) {
          dynamicY += (6 - distToMouse) * 0.18;
        }

        // Click Ripple shockwave
        if (ripple.active) {
          const rDist = Math.sqrt(u * u + w * w);
          const targetR = ripple.time * 6;
          const diff = Math.abs(rDist - targetR);
          if (diff < 2) {
            dynamicY += Math.sin(diff * Math.PI) * (1 - ripple.time / 3) * 0.8;
          }
        }

        positions.setY(i, dynamicY);
      }
      positions.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-auto z-0 overflow-hidden"
      style={{ cursor: 'crosshair' }}
      title="Click or move mouse to interact with 3D highland terrain & AI neural core"
    />
  );
};
