"use client";

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

export default function ClientImage(props: ImageProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div 
        className={`${props.className || ''} bg-gray-200 dark:bg-gray-700 animate-pulse`}
        style={{
          position: props.fill ? 'absolute' : 'relative',
          width: props.fill ? '100%' : props.width,
          height: props.fill ? '100%' : props.height,
        }}
      />
    );
  }

  return <Image {...props} />;
}