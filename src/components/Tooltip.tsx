import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        className="text-gray-400 hover:text-blue-400 transition-colors ml-1"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        <Info size={16} />
      </button>
      
      {isVisible && (
        <div className="absolute z-10 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg max-w-xs -top-2 left-6 transform -translate-y-full">
          <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          {content}
        </div>
      )}
    </div>
  );
};