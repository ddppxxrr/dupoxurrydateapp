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

      ctx.font = "bold 12px 'JetBrains Mono', monospace";
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
        ctx.fillText("I LOVE YOU", 0, 0);
        ctx.restore();
      }
      
      // Center Text
      ctx.font = ` ${Math.max(24, getScale() * 3)}px 'Cormorant Garamond', serif`;
      ctx.fillStyle = themeText;
      ctx.globalAlpha = 1;
      
      // Pulsing effect for center text
      const pulse = 1 + 0.08 * Math.pow(Math.sin(angle * 3), 2); // Heartbeat pulse
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(pulse, pulse);
      
      // Glow effect
      ctx.shadowColor = themeAccent;
      ctx.shadowBlur = 15 + 10 * Math.sin(angle * 3);
      
      ctx.fillText("I LOVE YOU", 0, 0);
      ctx.font = "normal 700 16px 'Inter', sans-serif";
      ctx.fillStyle = themeAccent;
      ctx.restore();

      angle += 0.05; // Speed of movement
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
      <audio 
        src="https://pub-581ea5ad3e98413e837b0d06ffad333f.r2.dev/angel.mp3"
        autoPlay
        loop
        className="hidden"
      />
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
