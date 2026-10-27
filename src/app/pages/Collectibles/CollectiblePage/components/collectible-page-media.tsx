import { FC, ReactNode } from 'react';

import { Model3DViewer } from 'app/atoms/Model3DViewer';
import { CollectibleMediaKind } from 'lib/metadata/collectible-media';

import { AudioCollectible } from '../../components/AudioCollectible';
import { HtmlCollectible } from '../../components/HtmlCollectible';
import { VideoCollectible } from '../../components/VideoCollectible';

interface CollectiblePageMediaProps {
  kind?: CollectibleMediaKind;
  uri?: string;
  alt?: string;
  className?: string;
  background: ReactNode;
  foreground: ReactNode;
  failed?: boolean;
  onError: EmptyFn;
  audioPoster?: ReactNode;
}

const CollectibleImageLayers: FC<Pick<CollectiblePageMediaProps, 'background' | 'foreground'>> = ({
  background,
  foreground
}) => (
  <>
    {background}
    {foreground}
  </>
);

const PlayableCollectiblePageMedia: FC<CollectiblePageMediaProps & { kind: CollectibleMediaKind; uri: string }> = ({
  kind,
  uri,
  alt,
  className,
  foreground,
  audioPoster,
  onError
}) => {
  if (kind === 'model') return <Model3DViewer uri={uri} alt={alt} onError={onError} />;

  if (kind === 'video') {
    return <VideoCollectible uri={uri} className={className} poster={foreground} onError={onError} />;
  }

  if (kind === 'audio') {
    return <AudioCollectible uri={uri} className={className} poster={audioPoster} onAudioError={onError} />;
  }

  return <HtmlCollectible uri={uri} title={alt} className={className} onError={onError} />;
};

export const CollectiblePageMedia: FC<CollectiblePageMediaProps> = props => {
  const { kind, uri, background, foreground, failed } = props;
  if (!kind || !uri || failed) return <CollectibleImageLayers background={background} foreground={foreground} />;

  return <PlayableCollectiblePageMedia key={`${kind}:${uri}`} {...props} kind={kind} uri={uri} />;
};
