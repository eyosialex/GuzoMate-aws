import React, { useEffect, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [targetPos, setTargetPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [cursorText, setCursorText] = useState('');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setTargetPos({ x: e.clientX, y: e.clientY });

      // Check if target or parent is interactive
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest('button, a, input, [data-interactive="true"]');
        if (interactive) {
          setIsHovered(true);
          const customLabel = interactive.getAttribute('data-cursor-text');
          setCursorText(customLabel || '');
        } else {
          setIsHovered(false);
          setCursorText('');
        }
      }
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Smooth lerp frame loop
    let animId: number;
    const lerp = () => {
      setPos((prev) => ({
        x: prev.x + (targetPos.x - prev.x) * 0.2,
        y: prev.y + (targetPos.y - prev.y) * 0.2,
      }));
      animId = requestAnimationFrame(lerp);
    };
    animId = requestAnimationFrame(lerp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animId);
    };
  }, [targetPos.x, targetPos.y]);

  // Hide on touch screens
  if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden hidden md:block">
      {/* Outer Ring */}
      <div
        className={`absolute rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-150 flex items-center justify-center font-bold text-[9px] tracking-wider uppercase backdrop-blur-[1px] ${
          isHovered
            ? 'w-16 h-16 bg-primary/20 border-2 border-primary text-primary scale-110 shadow-glow-emerald'
            : isClicked
            ? 'w-10 h-10 bg-secondary/30 border-2 border-secondary text-secondary scale-90'
            : 'w-8 h-8 border border-primary/50 text-transparent'
        }`}
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
        }}
      >
        {cursorText}
      </div>

      {/* Center Precision Pointer Dot */}
      <div
        className={`absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ${
          isClicked ? 'bg-secondary scale-150' : 'bg-primary'
        }`}
        style={{
          left: `${targetPos.x}px`,
          top: `${targetPos.y}px`,
        }}
      />
    </div>
  );
};
