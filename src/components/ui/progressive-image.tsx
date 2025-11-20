import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
}

/**
 * Progressive image component with blur-up effect
 * Shows a placeholder while loading for better UX on slow networks
 */
export const ProgressiveImage = ({
  src,
  alt,
  className,
  placeholderClassName,
  onLoad,
  onError,
  priority = false,
}: ProgressiveImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // Check if image is already cached
    if (img.complete && img.naturalHeight !== 0) {
      setIsLoaded(true);
      onLoad?.();
    }
  }, [onLoad]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div className="relative overflow-hidden">
      {/* Placeholder - gradient background */}
      {!isLoaded && !hasError && (
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br from-muted/50 to-muted animate-pulse',
            placeholderClassName
          )}
        />
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={cn(
          'transition-opacity duration-500',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        fetchPriority={priority ? 'high' : 'auto'}
      />

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center p-4">
            <div className="text-4xl mb-2">🖼️</div>
            <p className="text-xs text-muted-foreground">Image unavailable</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressiveImage;
