/**
 * @file Basit bir yükleme göstergesi (spinner) bileşeni.
 * @description Bu bileşen, bir işlemin devam ettiğini kullanıcıya göstermek için
 *              dönen bir halka animasyonu oluşturur. Farklı boyutlarda kullanılabilir.
 */

import React from 'react';

/** Spinner bileşeninin kabul ettiği proplar. */
interface SpinnerProps {
  /**
   * Spinner'ın boyutunu belirler.
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
}

/** Boyut proplarına karşılık gelen Tailwind CSS sınıfları. */
const sizeClasses = {
  small: 'w-6 h-6 border-2',
  medium: 'w-10 h-10 border-4',
  large: 'w-16 h-16 border-4',
};

const Spinner = ({ size = 'medium' }: SpinnerProps) => {
  return (
    <div className="flex justify-center items-center" aria-label="Yükleme göstergesi">
      <div
        className={`rounded-full ${sizeClasses[size]} border-brand-primary border-t-transparent`}
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">İçerik yükleniyor...</span>
      </div>
    </div>
  );
};

export default Spinner;