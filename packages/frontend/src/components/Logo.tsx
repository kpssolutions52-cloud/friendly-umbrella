'use client';

import Image from 'next/image';
import { useState } from 'react';
import { SITE_BRAND_NAME, SITE_LOGO_PATH } from '@/lib/siteBrand';

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
  src = SITE_LOGO_PATH,
  alt = SITE_BRAND_NAME,
  width = 240,
  height = 64,
  className = 'object-contain object-left',
  priority = false,
  unoptimized = false,
}: LogoProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (imageSrc === SITE_LOGO_PATH || imageSrc.endsWith('constructionguru-wordmark.svg')) {
      setImageSrc('/images/logo.svg');
    } else if (imageSrc.endsWith('logo.svg')) {
      setImageSrc('/images/logo.png');
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












