import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';

interface SmoothImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  skeletonClassName?: string;
}

export function SmoothImage({ src, alt, className, wrapperClassName, skeletonClassName, ...props }: SmoothImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={cn("relative overflow-hidden w-full h-full", wrapperClassName)}>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn("absolute inset-0 bg-dpxr-bg/50 animate-pulse flex items-center justify-center", skeletonClassName)}
          >
            {/* Minimalist loading indicator if you prefer, or just solid background pulsing */}
            <div className="w-1/3 h-1/3 bg-dpxr-muted/10 rounded-full blur-2xl"></div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        {...props}
      />
    </div>
  );
}
