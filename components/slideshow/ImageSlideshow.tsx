'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageSlideshowProps {
  images: string[];
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

export function ImageSlideshow({ 
  images, 
  autoPlay = true, 
  interval = 4000,
  className = ""
}: ImageSlideshowProps) {
  const hasLoop = images.length > 1;
  const extendedImages = hasLoop ? [images[images.length - 1], ...images, images[0]] : images;
  const [currentIndex, setCurrentIndex] = useState(hasLoop ? 1 : 0);
  const [isAnimating, setIsAnimating] = useState(true);

  // Reset indices when image list changes
  useEffect(() => {
    if (hasLoop) {
      setCurrentIndex(1);
    } else {
      setCurrentIndex(0);
    }
  }, [images, hasLoop]);

  // Autoplay advancing, seamless with loop
  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, images.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => prev - 1);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const goToSlide = (index: number) => {
    // map logical index to extended index
    setCurrentIndex(hasLoop ? index + 1 : index);
  };

  const handleTransitionEnd = () => {
    if (!hasLoop) return;
    // If we've moved to the cloned first (end) or cloned last (start), jump without animation
    if (currentIndex === 0) {
      setIsAnimating(false);
      setCurrentIndex(images.length);
      // re-enable animation on next frame
      requestAnimationFrame(() => setIsAnimating(true));
    } else if (currentIndex === extendedImages.length - 1) {
      setIsAnimating(false);
      setCurrentIndex(1);
      requestAnimationFrame(() => setIsAnimating(true));
    }
  };

  if (images.length === 0) {
    return (
      <div className={`bg-slate-800/50 rounded-xl flex items-center justify-center ${className}`}>
        <p className="text-slate-400">No images available</p>
      </div>
    );
  }

  const logicalIndex = hasLoop ? (currentIndex - 1 + images.length) % images.length : currentIndex;

  return (
    <div className={`relative ${className}`}>
      {/* Slideshow Frame */}
      <div className="relative h-full w-full overflow-hidden rounded-xl bg-slate-800/50 group">
        <div 
          className={`flex h-full ${isAnimating ? 'transition-transform duration-500 ease-in-out' : ''}`}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedImages.map((image, index) => (
            <div key={index} className="w-full h-full flex-shrink-0">
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {logicalIndex + 1} / {images.length}
        </div>

        {/* Dot Indicators (inside frame) */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-black/30 px-2 py-1 rounded-full">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  index === logicalIndex 
                    ? 'bg-cyan-400' 
                    : 'bg-slate-400/60 hover:bg-slate-300/80'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
