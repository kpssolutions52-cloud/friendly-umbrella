'use client';

import Image from 'next/image';
import { useState } from 'react';

interface LogoProps {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  unoptimized?: boolean;
}

export function Logo({
  src = '/images/logo.jpg',
  alt = 'ALLIED DIGITAL & EVENTS PTE. LTD.',
  width = 48,
  height = 48,
  className = 'object-contain',
  priority = false,
  unoptimized = false,
}: LogoProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (imageSrc.endsWith('.jpg') || imageSrc.endsWith('.jpeg')) {
      setImageSrc('/images/logo.png');
    } else if (imageSrc.endsWith('.png')) {
      setImageSrc('/images/logo.svg');
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return null;
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      priority={priority}
      unoptimized={unoptimized}
    />
  );
}








