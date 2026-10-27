import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { soundFX } from '../../lib/audioEffects';

interface TerrainRipple {
  originX: number;
  originZ: number;
  time: number;
  maxTime: number;
  speed: number;
  amplitude: number;
}

export const ThreeDHighlandCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const scrollRef = useRef({ y: 0, targetY: 0 });
  const activeRipplesRef = useRef<TerrainRipple[]>([]);

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

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
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

    // 3. 3D Mountain Terrain Mesh covering the full screen
    // We size it 64x64 and tilt it by ~65° so every pixel on screen projects directly onto it
    const terrainGeo = new THREE.PlaneGeometry(64, 64, 84, 84);
    terrainGeo.rotateX(-Math.PI * 0.36); // Tilted towards the camera

    const posAttr = terrainGeo.attributes.position;
    const initialY = new Float32Array(posAttr.count);

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      // Valley in center, dramatic mountain peaks on ridges
      const elevation =
        Math.sin(x * 0.3) * Math.cos(z * 0.3) * 1.8 +
        Math.sin(x * 0.6 + 1.2) * 0.9 +
        (dist > 7 ? (dist - 7) * 0.25 : 0);
      posAttr.setY(i, elevation);
      initialY[i] = elevation;
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

    // 4. Floating 3D Holographic AI Neural Core
    const sphereGeo = new THREE.IcosahedronGeometry(1.8, 4);
    const sphereMat = new THREE.PointsMaterial({
      color: 0xd97706,
      size: 0.05,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const neuralSphere = new THREE.Points(sphereGeo, sphereMat);
    neuralSphere.position.set(0, 2.5, -1);
    scene.add(neuralSphere);

    const innerCoreGeo = new THREE.IcosahedronGeometry(0.9, 2);
    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    neuralSphere.add(innerCore);

    // 5. Glowing Neon Route Highway Vector
    const routeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-16, -0.6, -12),
      new THREE.Vector3(-7, -0.8, -6),
      new THREE.Vector3(0, -1.0, 0),
      new THREE.Vector3(6, -0.6, 6),
      new THREE.Vector3(14, 0.2, 10),
    ]);
    const routeGeo = new THREE.TubeGeometry(routeCurve, 64, 0.08, 8, false);
    const routeMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.9,
    });
    const routeMesh = new THREE.Mesh(routeGeo, routeMat);
    routeMesh.position.set(0, -1.4, -4);
    scene.add(routeMesh);

    // Traveling Energy Pulse
    const pulseGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      blending: THREE.AdditiveBlending,
    });
    const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
    scene.add(pulseMesh);

    // 6. Raycasting & Precision Mouse Mapping
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleClick = (e: MouseEvent) => {
      soundFX.playRadarPing();

      // Update camera world matrix so raycasting is 100% frame-accurate
      camera.updateMatrixWorld(true);

      // Convert mouse click to NDC [-1, 1]
      mouseVec.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseVec.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouseVec, camera);

      // Raycast directly against the 3D terrain mesh
      const hits = raycaster.intersectObject(terrainMesh);
      let originX = 0;
      let originZ = 0;

      if (hits.length > 0) {
        // Transform the exact world intersection point into the terrain's local coordinates
        const localHit = terrainMesh.worldToLocal(hits[0].point.clone());
        originX = localHit.x;
        originZ = localHit.z;
      } else {
        // Fallback proportional mapping if clicked at edge
        originX = mouseVec.x * 25;
        originZ = -mouseVec.y * 15;
      }

      // Spawn physical 3D vertex ripple originating EXACTLY at this mouse click point
      activeRipplesRef.current.push({
        originX,
        originZ,
        time: 0,
        maxTime: 3.2,
        speed: 12.0,
        amplitude: 1.5,
      });

      // Keep max 5 concurrent ripples
      if (activeRipplesRef.current.length > 5) {
        activeRipplesRef.current.shift();
      }
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const handleScroll = () => {
      scrollRef.current.targetY = window.scrollY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 7. Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera parallax & scroll depth
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      scrollRef.current.y += (scrollRef.current.targetY - scrollRef.current.y) * 0.06;

      const scrollShift = scrollRef.current.y * 0.0018;

      camera.position.x = mouseRef.current.x * 2.2;
      camera.position.y = 5 + mouseRef.current.y * 1.2 - Math.min(scrollShift * 1.5, 2.5);
      camera.position.z = 12 - Math.min(scrollShift * 3.0, 3.5);
      camera.lookAt(0, -Math.min(scrollShift * 0.8, 1.5), 0);
      camera.updateMatrixWorld(true);

      // Rotate AI Neural Core
      neuralSphere.rotation.y = elapsedTime * 0.4;
      neuralSphere.rotation.x = Math.sin(elapsedTime * 0.3) * 0.2;
      const sphereScale = 1 + Math.sin(elapsedTime * 2) * 0.08;
      neuralSphere.scale.set(sphereScale, sphereScale, sphereScale);
      innerCore.rotation.y = -elapsedTime * 0.8;

      // Traveling Energy Pulse
      const pulseProgress = (elapsedTime * 0.15) % 1;
      const pointOnCurve = routeCurve.getPoint(pulseProgress);
      pulseMesh.position.set(pointOnCurve.x, pointOnCurve.y - 1.4, pointOnCurve.z - 4);

      // Update 3D vertex wave ripples
      const ripples = activeRipplesRef.current;
      for (let r = ripples.length - 1; r >= 0; r--) {
        ripples[r].time += 0.026;
        if (ripples[r].time > ripples[r].maxTime) {
          ripples.splice(r, 1);
        }
      }

      // Mouse hover local coordinates
      mouseVec.x = mouseRef.current.x;
      mouseVec.y = mouseRef.current.y;
      raycaster.setFromCamera(mouseVec, camera);
      const hoverHits = raycaster.intersectObject(terrainMesh);
      let hoverLocalX = 0;
      let hoverLocalZ = 0;
      if (hoverHits.length > 0) {
        const localHover = terrainMesh.worldToLocal(hoverHits[0].point.clone());
        hoverLocalX = localHover.x;
        hoverLocalZ = localHover.z;
      }

      // Procedural Real-time Vertex Wave & Click Ripple on Terrain
      const positions = terrainGeo.attributes.position;

      for (let i = 0; i < positions.count; i++) {
        const u = positions.getX(i);
        const w = positions.getZ(i);
        let dynamicY = initialY[i];

        // Organic undulating baseline mountain wave
        dynamicY += Math.sin(u * 0.45 + elapsedTime * 1.1) * Math.cos(w * 0.45 + elapsedTime * 0.75) * 0.22;

        // Interactive mouse hover displacement
        const dxMouse = u - hoverLocalX;
        const dzMouse = w - hoverLocalZ;
        const distToMouse = Math.sqrt(dxMouse * dxMouse + dzMouse * dzMouse);
        if (distToMouse < 5.5) {
          dynamicY += (5.5 - distToMouse) * 0.22;
        }

        // 3D RIPPLE SHOCKWAVE EXPANDING FROM EXACT MOUSE CLICK POSITION
        for (let r = 0; r < ripples.length; r++) {
          const rip = ripples[r];
          const dx = u - rip.originX;
          const dz = w - rip.originZ;
          const dist = Math.sqrt(dx * dx + dz * dz);

          const waveRadius = rip.time * rip.speed;
          const distDiff = Math.abs(dist - waveRadius);

          if (distDiff < 3.5) {
            const phase = (distDiff / 3.5) * Math.PI;
            const waveShape = Math.cos(phase);
            const decay = Math.exp(-rip.time * 0.8) * Math.max(0, 1 - dist / 38);
            dynamicY += waveShape * rip.amplitude * decay;
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
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);

      // Clean up Three.js allocations
      renderer.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      routeGeo.dispose();
      routeMat.dispose();
      pulseGeo.dispose();
      pulseMat.dispose();
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
      title="Click anywhere to trigger 3D highland terrain ripples at your exact cursor position"
    />
  );
};
