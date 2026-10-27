import React from 'react';
import { CustomCursor } from './CustomCursor';
import { ThreeDHighlandCanvas } from './ThreeDHighlandCanvas';
import { HeroPresentation } from './HeroPresentation';
import { InteractiveTravelArcade } from './InteractiveTravelArcade';
import { IntelligentAIShowcase } from './IntelligentAIShowcase';
import { BentoShowcase } from './BentoShowcase';
import { VerifiedPlacesShowcase } from './VerifiedPlacesShowcase';
import { LandingFooter } from './LandingFooter';

export const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-surface text-on-surface overflow-x-hidden selection:bg-secondary/30 selection:text-secondary-dark">
      {/* Interactive Custom Magnetic Cursor */}
      <CustomCursor />

      {/* Interactive 3D WebGL Three.js Canvas: Terrain Mesh & AI Neural Core */}
      <ThreeDHighlandCanvas />

      {/* Main Presentation Flow */}
      <div className="relative z-10 space-y-16 sm:space-y-24">
        {/* 1. Grand Presentation Hero */}
        <HeroPresentation />

        {/* 2. Playable Multi-Modal Travel Arcade (Car, Train, Hiker, AI) */}
        <InteractiveTravelArcade />

        {/* 3. Pure Graphical AI Intelligence Labs (Radar, Script Morph, Altitude Dial) */}
        <IntelligentAIShowcase />

        {/* 4. Interactive 3D Bento Grid (360° Radar, Offline Mesh, Language Parity, SOS) */}
        <BentoShowcase />

        {/* 5. Audited Highland Places Showcase */}
        <VerifiedPlacesShowcase />

        {/* 6. Footer */}
        <LandingFooter />
      </div>
    </div>
  );
};

export default LandingPage;
