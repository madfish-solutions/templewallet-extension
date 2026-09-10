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

/**
 * @arg sources // Memoize
 */
export const useImagesStackLoading = (sources: string[] | ImageSourceStage[], immediate = false) => {
  const stages = useMemoWithCompare(() => normalizeImageSources(sources), [sources], areImageSourceStagesEqual);
  const emptyStack = stages.length < 1;
  const raceOffDom = shouldRaceOffDom(stages);

  const prevStagesRef = useRef(stages);
  const loadGenerationRef = useRef(0);

  const [index, setIndex] = useState(emptyStack ? -1 : 0);
  const [racedSrc, setRacedSrc] = useState<string>();
  const [isLoading, setIsLoading] = useState(!emptyStack);
  const [isStackFailed, setIsStackFailed] = useState(emptyStack);

  useDidUpdate(() => {
    if (areImageSourceStagesEqual(prevStagesRef.current, stages)) {
      return;
    }

    prevStagesRef.current = stages;

    if (stages.length > 0) {
      setIndex(0);
      setRacedSrc(undefined);
      setIsLoading(true);
      setIsStackFailed(false);

      if (!shouldRaceOffDom(stages)) {
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
    if (!shouldRaceOffDom(stages) || stages.length === 0) {
      return;
    }

    const controller = new AbortController();
    const generation = ++loadGenerationRef.current;

    void loadImageSourceStages(stages, { signal: controller.signal, immediate })
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

  const onSuccess = () => void setIsLoading(false);

  const onFail = () => {
    if (isStackFailed) {
      return;
    }

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
