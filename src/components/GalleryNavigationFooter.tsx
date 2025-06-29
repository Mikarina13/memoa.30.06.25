import React from 'react';
import { ChevronLeft, ChevronRight, Keyboard } from 'lucide-react';

interface GalleryNavigationFooterProps {
  currentIndex: number;
  totalItems: number;
  onPrev: () => void;
  onNext: () => void;
  onSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function GalleryNavigationFooter({
  currentIndex,
  totalItems,
  onPrev,
  onNext,
  onSliderChange
}: GalleryNavigationFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 w-full py-4 bg-black/70 backdrop-blur-sm border-t border-white/10 z-50">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onPrev}
            className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            aria-label="Previous item"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="100"
              value={totalItems <= 1 ? 0 : (currentIndex / (totalItems - 1)) * 100}
              onChange={onSliderChange}
              className="w-full h-2 bg-white/20 rounded appearance-none cursor-pointer accent-blue-500"
              aria-label="Gallery position"
            />
            <div className="flex items-center justify-center text-white/80 text-sm mt-2">
              <Keyboard className="w-4 h-4 mr-2" />
              <span>Use <kbd className="px-1.5 py-0.5 bg-white/10 rounded mr-1">◀</kbd><kbd className="px-1.5 py-0.5 bg-white/10 rounded">▶</kbd> or <kbd className=\"px-1.5 py-0.5 bg-white/10 rounded mr-1">A</kbd><kbd className=\"px-1.5 py-0.5 bg-white/10 rounded">D</kbd> to Navigate • {currentIndex + 1} of {totalItems}</span>
            </div>
          </div>
          
          <button
            onClick={onNext}
            className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            aria-label="Next item"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}