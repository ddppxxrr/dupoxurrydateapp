import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

export default function BirthdaySurprise({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;
    const NUM_STEPS = 90;
    
    // Function to calculate responsive scale based on screen width
    const getScale = () => Math.min(window.innerWidth, window.innerHeight) / 40;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    function heartX(t: number) { return 16 * Math.pow(Math.sin(t), 3); }
    function heartY(t: number) { return 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2 - 20; // Slight offset up
      const SCALE = getScale();
      
      const themeAccent = getComputedStyle(canvas).getPropertyValue('--color-dpxr-accent').trim() || '#ff6b95';
      const themeText = getComputedStyle(canvas).getPropertyValue('--color-dpxr-text').trim() || '#fff0f5';

      ctx.font = "bold 12px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = themeAccent;

      for (let i = 0; i < NUM_STEPS; i++) {
        // Offset t by angle to make the points travel along the heart path
        const t = (i / NUM_STEPS) * Math.PI * 2 + angle;
        const x = cx + heartX(t) * SCALE;
        const y = cy - heartY(t) * SCALE;
        
        ctx.save();
        ctx.translate(x, y);
        // Opacity oscillation for twinkling effect
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 10 + angle * 5);
        ctx.fillText("I love you", 0, 0);
        ctx.restore();
      }
      
      // Center Text
      ctx.font = `italic ${Math.max(24, getScale() * 3)}px 'Cormorant Garamond', serif`;
      ctx.fillStyle = themeText;
      ctx.globalAlpha = 1;
      
      // Pulsing effect for center text
      const pulse = 1 + 0.05 * Math.sin(angle * 2);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(pulse, pulse);
      ctx.fillText("H A P P Y   B I R T H D A Y", 0, 0);
      ctx.font = "16px 'Inter', sans-serif";
      ctx.fillStyle = themeAccent;
      ctx.restore();

      angle += 0.01; // Speed of movement
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center overflow-hidden theme-birthday"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 w-12 h-12 bg-dpxr-bg/50 border border-dpxr-accent text-dpxr-accent rounded-full flex items-center justify-center hover:bg-dpxr-accent hover:text-dpxr-bg transition-all z-10"
      >
        <X className="w-6 h-6" />
      </button>
    </motion.div>
  );
}
