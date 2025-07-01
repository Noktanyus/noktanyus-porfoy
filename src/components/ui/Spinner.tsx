// src/components/ui/Spinner.tsx
import React from 'react';

const Spinner = ({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) => {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-10 h-10 border-4',
    large: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} border-blue-500 border-t-transparent`}
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Yükleniyor...</span>
      </div>
    </div>
  );
};

export default Spinner;
