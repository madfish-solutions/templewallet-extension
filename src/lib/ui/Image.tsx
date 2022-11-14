import React from 'react';

import ReactImageFallback from 'react-image-fallback';

interface Props {
  src: string;
  alt?: string;
  className?: string;
  loader?: React.ReactElement;
  fallback?: React.ReactElement;
}

/*
  Correction to discard React warnings.
  Issue: https://github.com/socialtables/react-image-fallback/issues/49
  PR: https://github.com/socialtables/react-image-fallback/pull/59
*/
ReactImageFallback.prototype.componentDidUpdate = ReactImageFallback.prototype.componentWillReceiveProps;
delete ReactImageFallback.prototype.componentWillReceiveProps;

export const Image: React.FC<Props> = ({ src, alt, className, loader, fallback }) => (
  <ReactImageFallback
    src={src}
    className={className}
    alt={alt}
    initialImage={loader}
    fallbackImage={fallback || <img src={src} alt={alt} className={className} />}
  />
);
