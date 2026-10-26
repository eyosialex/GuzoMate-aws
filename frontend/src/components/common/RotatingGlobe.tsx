import React, { useEffect, useRef } from 'react';

/**
 * World continent polygon coordinates in [longitude, latitude] degrees.
 * Rotates smoothly in 3D spherical projection.
 */
const CONTINENTS: [number, number][][] = [
  // Africa
  [
    [-17, 15], [-17, 21], [-13, 28], [-5, 36], [10, 37], [11, 33], [25, 32], [32, 31],
    [34, 28], [36, 22], [43, 12], [51, 12], [49, 10], [42, 2], [41, -4], [35, -12],
    [36, -20], [33, -27], [28, -32], [20, -35], [18, -34], [15, -28], [12, -18],
    [10, -5], [9, 4], [3, 6], [-3, 5], [-8, 4], [-13, 7], [-17, 11], [-17, 15]
  ],
  // Madagascar
  [
    [44, -12], [50, -13], [50, -16], [47, -25], [44, -25], [44, -16], [44, -12]
  ],
  // Europe
  [
    [-9, 36], [-9, 43], [0, 43], [1, 46], [-4, 48], [-1, 51], [8, 54], [10, 58],
    [24, 60], [28, 65], [20, 70], [28, 71], [40, 67], [50, 68], [60, 60], [50, 50],
    [40, 46], [30, 46], [28, 41], [23, 38], [14, 38], [16, 41], [9, 44], [3, 42],
    [-2, 37], [-9, 36]
  ],
  // British Isles
  [
    [-5, 50], [-1, 51], [1, 53], [-2, 58], [-6, 58], [-5, 54], [-5, 50]
  ],
  // Asia
  [
    [36, 36], [44, 40], [50, 42], [52, 54], [60, 60], [70, 72], [100, 76], [140, 73],
    [170, 66], [180, 65], [170, 60], [142, 50], [130, 43], [122, 38], [120, 31],
    [108, 22], [108, 15], [104, 10], [100, 4], [96, 17], [89, 22], [80, 16],
    [80, 9], [76, 9], [73, 20], [68, 23], [60, 25], [56, 26], [50, 26], [44, 15],
    [44, 13], [36, 22], [35, 30], [36, 36]
  ],
  // Arabian Peninsula
  [
    [35, 30], [40, 28], [50, 26], [56, 26], [59, 22], [54, 17], [45, 13], [44, 15],
    [40, 20], [35, 30]
  ],
  // India Subcontinent
  [
    [68, 23], [73, 20], [76, 9], [80, 9], [80, 16], [88, 22], [88, 26], [78, 30],
    [68, 23]
  ],
  // Japan
  [
    [130, 32], [136, 35], [141, 41], [141, 44], [145, 44], [142, 39], [137, 34], [130, 32]
  ],
  // Australia
  [
    [114, -22], [114, -34], [118, -35], [135, -34], [138, -38], [147, -38], [153, -28],
    [149, -20], [142, -11], [136, -12], [131, -14], [124, -16], [114, -22]
  ],
  // North America
  [
    [-168, 66], [-160, 71], [-130, 70], [-95, 73], [-80, 62], [-65, 58], [-55, 52],
    [-65, 44], [-75, 35], [-80, 25], [-82, 23], [-90, 21], [-97, 26], [-97, 18],
    [-84, 10], [-78, 8], [-85, 12], [-95, 16], [-105, 23], [-117, 32], [-124, 38],
    [-125, 50], [-135, 57], [-150, 60], [-165, 60], [-168, 66]
  ],
  // South America
  [
    [-78, 8], [-72, 11], [-60, 8], [-50, -1], [-35, -6], [-37, -12], [-41, -21],
    [-48, -27], [-58, -38], [-68, -54], [-75, -50], [-72, -40], [-71, -30], [-77, -18],
    [-81, -5], [-80, 2], [-78, 8]
  ]
];

// Highland Corridor route points [lon, lat] across Ethiopia
const ETHIOPIA_CORRIDOR_LONLAT: [number, number][] = [
  [38.74, 9.03],   // Addis Ababa
  [39.02, 9.15],   // Sendafa
  [39.30, 9.33],   // Sheno
  [39.53, 9.68],   // Debre Birhan
  [39.75, 9.85],   // Termaber Pass
  [39.63, 11.13],  // Dessie
];

export const RotatingGlobe: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotation = 0; // Earth rotation angle in radians
    const rotSpeed = 0.0035; // Continuous rotation speed
    const axialTilt = 23.5 * (Math.PI / 180); // Earth's 23.5-degree axial tilt
    const cosTilt = Math.cos(axialTilt);
    const sinTilt = Math.sin(axialTilt);

    // Generate static stars once
    const starCount = 180;
    const stars: { x: number; y: number; r: number; alpha: number; speed: number }[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.5 + 0.4,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.02 + 0.01,
      });
    }

    let width = 0;
    let height = 0;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    /**
     * 3D Sphere projection: converts spherical (lon, lat) in degrees
     * into 3D coords, rotates around Y axis with axial tilt, and projects.
     */
    const project = (
      lonDeg: number,
      latDeg: number,
      currentRot: number,
      radius: number,
      cx: number,
      cy: number
    ): { x: number; y: number; z: number; visible: boolean } => {
      const lambda = (lonDeg * Math.PI) / 180 + currentRot;
      const phi = (latDeg * Math.PI) / 180;

      // Base sphere coordinate
      const x0 = radius * Math.cos(phi) * Math.sin(lambda);
      const y0 = -radius * Math.sin(phi);
      const z0 = radius * Math.cos(phi) * Math.cos(lambda);

      // Apply 23.5-degree axial tilt
      const y1 = y0 * cosTilt - z0 * sinTilt;
      const z1 = y0 * sinTilt + z0 * cosTilt;
      const x1 = x0;

      return {
        x: cx + x1,
        y: cy + y1,
        z: z1,
        visible: z1 > 0, // Facing observer hemisphere
      };
    };

    let pulsePhase = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Deep Space Cosmic Background
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, '#091c13');
      bgGrad.addColorStop(0.45, '#05110a');
      bgGrad.addColorStop(1, '#020704');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Twinkling Stars Field
      pulsePhase += 0.03;
      stars.forEach((star, idx) => {
        const starX = star.x * width;
        const starY = star.y * height;
        const flicker = Math.sin(pulsePhase * star.speed * 50 + idx) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(220, 252, 231, ${star.alpha * flicker * 0.75})`;
        ctx.beginPath();
        ctx.arc(starX, starY, star.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Globe center & radius (responsive, perfectly framed)
      const isMobile = width < 768;
      const globeRadius = Math.min(width, height) * (isMobile ? 0.38 : 0.32);
      const globeCx = isMobile ? width * 0.5 : width * 0.62;
      const globeCy = isMobile ? height * 0.38 : height * 0.5;

      // 3. Atmospheric Outer Glow (Emerald Sheen)
      const atmosGrad = ctx.createRadialGradient(
        globeCx,
        globeCy,
        globeRadius * 0.85,
        globeCx,
        globeCy,
        globeRadius * 1.35
      );
      atmosGrad.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
      atmosGrad.addColorStop(0.35, 'rgba(34, 197, 94, 0.16)');
      atmosGrad.addColorStop(0.7, 'rgba(5, 150, 105, 0.06)');
      atmosGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');

      ctx.fillStyle = atmosGrad;
      ctx.beginPath();
      ctx.arc(globeCx, globeCy, globeRadius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // 4. Globe Base Sphere (Ocean Dark Emerald)
      const oceanGrad = ctx.createRadialGradient(
        globeCx - globeRadius * 0.35,
        globeCy - globeRadius * 0.35,
        globeRadius * 0.1,
        globeCx,
        globeCy,
        globeRadius
      );
      oceanGrad.addColorStop(0, '#113524');
      oceanGrad.addColorStop(0.5, '#0c2519');
      oceanGrad.addColorStop(0.85, '#07170f');
      oceanGrad.addColorStop(1, '#030a06');

      ctx.save();
      ctx.beginPath();
      ctx.arc(globeCx, globeCy, globeRadius, 0, Math.PI * 2);
      ctx.clip(); // Clip all continents and graticules to the sphere circle

      ctx.fillStyle = oceanGrad;
      ctx.fill();

      // 5. Latitude Graticules
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.12)';
      ctx.lineWidth = 1;
      [-60, -30, 0, 30, 60].forEach((lat) => {
        ctx.beginPath();
        let first = true;
        for (let lon = -180; lon <= 180; lon += 5) {
          const pt = project(lon, lat, rotation, globeRadius, globeCx, globeCy);
          if (pt.visible) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            first = true;
          }
        }
        ctx.stroke();
      });

      // 6. Longitude Meridians
      for (let lon = 0; lon < 360; lon += 30) {
        ctx.beginPath();
        let first = true;
        for (let lat = -80; lat <= 80; lat += 4) {
          const pt = project(lon, lat, rotation, globeRadius, globeCx, globeCy);
          if (pt.visible) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            first = true;
          }
        }
        ctx.stroke();
      }

      // 7. Continents and Landmass Polygons
      CONTINENTS.forEach((poly) => {
        ctx.beginPath();
        let anyVisible = false;
        let started = false;

        poly.forEach(([lon, lat]) => {
          const pt = project(lon, lat, rotation, globeRadius, globeCx, globeCy);
          if (pt.visible) {
            anyVisible = true;
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            started = false;
          }
        });

        if (anyVisible) {
          ctx.fillStyle = 'rgba(52, 211, 153, 0.22)';
          ctx.strokeStyle = 'rgba(110, 231, 183, 0.65)';
          ctx.lineWidth = 1.2;
          ctx.fill();
          ctx.stroke();
        }
      });

      // 8. Ethiopian Highland Highway Corridors on the Globe
      const ethPts = ETHIOPIA_CORRIDOR_LONLAT.map(([lon, lat]) =>
        project(lon, lat, rotation, globeRadius, globeCx, globeCy)
      );

      const allEthVisible = ethPts.some((p) => p.visible);
      if (allEthVisible) {
        ctx.beginPath();
        let startRoute = false;
        ethPts.forEach((pt) => {
          if (pt.visible) {
            if (!startRoute) {
              ctx.moveTo(pt.x, pt.y);
              startRoute = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        });
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 9. 3D Spherical Specular Shading (Atmospheric Shadow & Rim)
      const sphereShade = ctx.createRadialGradient(
        globeCx - globeRadius * 0.4,
        globeCy - globeRadius * 0.4,
        globeRadius * 0.15,
        globeCx,
        globeCy,
        globeRadius
      );
      sphereShade.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      sphereShade.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
      sphereShade.addColorStop(0.85, 'rgba(0, 0, 0, 0.45)');
      sphereShade.addColorStop(1, 'rgba(0, 0, 0, 0.88)');

      ctx.fillStyle = sphereShade;
      ctx.beginPath();
      ctx.arc(globeCx, globeCy, globeRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // Restore clip

      // 10. Ethiopia / Addis Ababa Highland Beacon & Telemetry HUD
      const ethCenter = project(38.74, 9.03, rotation, globeRadius, globeCx, globeCy);
      if (ethCenter.visible) {
        const beaconPulse = (Math.sin(pulsePhase * 3) + 1) / 2;
        const outerR = 10 + beaconPulse * 16;

        // Concentric radar waves
        ctx.strokeStyle = `rgba(52, 211, 153, ${0.8 - beaconPulse * 0.6})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ethCenter.x, ethCenter.y, outerR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(245, 158, 11, ${0.9 - beaconPulse * 0.5})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(ethCenter.x, ethCenter.y, outerR * 0.55, 0, Math.PI * 2);
        ctx.stroke();

        // Core beacon dot
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(ethCenter.x, ethCenter.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Telemetry callout line and floating HUD tag
        const tagX = ethCenter.x + (isMobile ? -140 : 60);
        const tagY = ethCenter.y - (isMobile ? 50 : 45);

        ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ethCenter.x, ethCenter.y);
        ctx.lineTo(ethCenter.x + (isMobile ? -30 : 25), ethCenter.y - 20);
        ctx.lineTo(tagX + 60, ethCenter.y - 20);
        ctx.stroke();

        // HUD Pill Box
        ctx.fillStyle = 'rgba(15, 43, 29, 0.9)';
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
        ctx.lineWidth = 1;
        const boxW = 160;
        const boxH = 40;
        const boxX = tagX - (isMobile ? 0 : 30);
        const boxY = tagY - 12;

        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('ETHIOPIA • 2,355m', boxX + 10, boxY + 16);

        ctx.fillStyle = '#34d399';
        ctx.font = '9px sans-serif';
        ctx.fillText('9.0054° N, 38.7885° E', boxX + 10, boxY + 30);
      }

      // 11. Orbiting High-Altitude Satellite & Radio Telemetry
      const satAngle = rotation * 2.2;
      const orbitRx = globeRadius * 1.35;
      const orbitRy = globeRadius * 0.45;
      const satX = globeCx + orbitRx * Math.cos(satAngle);
      const satY = globeCy + orbitRy * Math.sin(satAngle);

      // Orbital ellipse track
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.ellipse(globeCx, globeCy, orbitRx, orbitRy, -axialTilt, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Satellite icon & telemetry radio flash
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(satX, satY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Increment rotation continuously (Earth spins from West to East)
      rotation += rotSpeed;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Subtle overlay gradient to ensure high-contrast readability of all page contents */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#091811]/70 via-[#07150e]/60 to-[#040c08]/85 pointer-events-none" />
    </div>
  );
};

export default RotatingGlobe;
