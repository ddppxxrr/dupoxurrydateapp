import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const loadedImageUrls = new Set<string>();

interface SmoothImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  skeletonClassName?: string;
}

export function SmoothImage({ src, alt, className, wrapperClassName, skeletonClassName, ...props }: SmoothImageProps) {
  const isCached = Boolean(src && typeof src === 'string' && loadedImageUrls.has(src));
  
  const [isLoading, setIsLoading] = useState(!isCached);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (src && typeof src === 'string') {
      if (loadedImageUrls.has(src)) {
        setIsLoading(false);
      } else if (imgRef.current?.complete) {
        loadedImageUrls.add(src);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
    }
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (src && typeof src === 'string') loadedImageUrls.add(src);
    setIsLoading(false);
    if (props.onLoad) props.onLoad(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    if (props.onError) props.onError(e);
  };

  return (
    <div className={cn("relative overflow-hidden w-full h-full", wrapperClassName)}>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("absolute inset-0 bg-dpxr-bg/50 animate-pulse flex items-center justify-center z-10", skeletonClassName)}
          >
            <div className="w-1/3 h-1/3 bg-dpxr-muted/10 rounded-full blur-2xl"></div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={isCached ? "eager" : "lazy"}
        decoding={isCached ? "sync" : "async"}
        className={cn(
          "w-full h-full object-cover",
          !isCached && "transition-opacity duration-700 ease-in-out",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
}
