import { useEffect, useRef, useState } from 'react';

import { useDidUpdate, useMemoWithCompare } from 'lib/ui/hooks';
import {
  areImageSourceStagesEqual,
  ImageSourceStage,
  loadImageSourceStages,
  normalizeImageSources
} from 'lib/ui/race-image-urls';

const shouldRaceOffDom = (stages: ImageSourceStage[]) =>
  stages.some(stage => stage.urls.length > 1 || Boolean(stage.delayMs));

const loadedSrcs = new Map<string, string>();

const getStackKey = (stages: ImageSourceStage[]) => stages.flatMap(stage => stage.urls).join('\0');

const findLoadedSrc = (stages: ImageSourceStage[]) => {
  const url = loadedSrcs.get(getStackKey(stages));
  if (!url) return undefined;

  const index = stages.findIndex(stage => stage.urls.includes(url));

  return index === -1 ? undefined : { index, url };
};

/**
 * @arg sources // Memoize
 */
export const useImagesStackLoading = (sources: string[] | ImageSourceStage[], immediate = false) => {
  const stages = useMemoWithCompare(() => normalizeImageSources(sources), [sources], areImageSourceStagesEqual);
  const emptyStack = stages.length < 1;
  const raceOffDom = shouldRaceOffDom(stages);

  const prevStagesRef = useRef(stages);
  const loadGenerationRef = useRef(0);

  const [loadedAtMount] = useState(() => findLoadedSrc(stages));
  const [index, setIndex] = useState(loadedAtMount?.index ?? (emptyStack ? -1 : 0));
  const [racedSrc, setRacedSrc] = useState(loadedAtMount?.url);
  const [isLoading, setIsLoading] = useState(!emptyStack && !loadedAtMount);
  const [isStackFailed, setIsStackFailed] = useState(emptyStack);

  useDidUpdate(() => {
    if (areImageSourceStagesEqual(prevStagesRef.current, stages)) {
      return;
    }

    prevStagesRef.current = stages;

    if (stages.length > 0) {
      const loaded = findLoadedSrc(stages);

      setIndex(loaded?.index ?? 0);
      setRacedSrc(loaded?.url);
      setIsLoading(!loaded);
      setIsStackFailed(false);

      if (!loaded && !shouldRaceOffDom(stages)) {
        const img = new Image();
        img.src = stages[0].urls[0];
        if (img.complete) {
          setIsLoading(false);
        }
      }
    } else {
      setIndex(-1);
      setRacedSrc(undefined);
      setIsLoading(false);
      setIsStackFailed(true);
    }
  }, [stages]);

  useEffect(() => {
    if (!shouldRaceOffDom(stages) || stages.length === 0) return;

    const controller = new AbortController();
    const generation = ++loadGenerationRef.current;
    const loaded = findLoadedSrc(stages);
    const load: ReturnType<typeof loadImageSourceStages> = loaded
      ? Promise.resolve(loaded.url)
      : loadImageSourceStages(stages, { signal: controller.signal, immediate });

    void load
      .then(winner => {
        if (controller.signal.aborted || generation !== loadGenerationRef.current) {
          return;
        }

        if (winner) {
          setRacedSrc(winner);
          setIsLoading(false);

          return;
        }

        setRacedSrc(undefined);
        setIndex(-1);
        setIsLoading(false);
        setIsStackFailed(true);
      })
      .catch(() => {
        if (controller.signal.aborted || generation !== loadGenerationRef.current) {
          return;
        }

        setRacedSrc(undefined);
        setIndex(-1);
        setIsLoading(false);
        setIsStackFailed(true);
      });

    return () => {
      loadGenerationRef.current += 1;
      controller.abort();
    };
  }, [stages, immediate]);

  const src = raceOffDom ? racedSrc : stages.at(index)?.urls[0];

  const onSuccess = () => {
    if (src) loadedSrcs.set(getStackKey(stages), src);
    setIsLoading(false);
  };

  const onFail = () => {
    if (isStackFailed) {
      return;
    }

    if (src) loadedSrcs.delete(getStackKey(stages));

    if (raceOffDom) {
      if (racedSrc) {
        setRacedSrc(undefined);
        setIndex(-1);
        setIsLoading(false);
        setIsStackFailed(true);
      }

      return;
    }

    if (index + 1 === stages.length) {
      setIndex(-1);
      setIsLoading(false);
      setIsStackFailed(true);

      return;
    }

    setIndex(index + 1);
  };

  return {
    src,
    isLoading,
    isStackFailed,
    onSuccess,
    onFail
  };
};
