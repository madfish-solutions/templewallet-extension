import { FC, ReactNode, useState } from 'react';

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
  background,
  foreground,
  audioPoster
}) => {
  const [failed, setFailed] = useState(false);
  const handleError = () => setFailed(true);

  if (failed) return <CollectibleImageLayers background={background} foreground={foreground} />;

  if (kind === 'model') return <Model3DViewer uri={uri} alt={alt} onError={handleError} />;

  if (kind === 'video') {
    return <VideoCollectible uri={uri} className={className} poster={foreground} onError={handleError} />;
  }

  if (kind === 'audio') {
    return <AudioCollectible uri={uri} className={className} poster={audioPoster} onAudioError={handleError} />;
  }

  return <HtmlCollectible uri={uri} title={alt} className={className} onError={handleError} />;
};

export const CollectiblePageMedia: FC<CollectiblePageMediaProps> = props => {
  const { kind, uri } = props;
  if (!kind || !uri) return <CollectibleImageLayers background={props.background} foreground={props.foreground} />;

  return <PlayableCollectiblePageMedia key={`${kind}:${uri}`} {...props} kind={kind} uri={uri} />;
};
