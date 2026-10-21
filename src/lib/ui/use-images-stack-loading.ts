import { useEffect, useRef, useState } from 'react';

import { useDidUpdate, useMemoWithCompare } from 'lib/ui/hooks';
import {
  areImageSourceStagesEqual,
  ImageSourceStage,
  loadImageSourceStages,
  normalizeImageSources
} from 'lib/ui/race-image-urls';

const needsRacer = (stage: ImageSourceStage) => stage.urls.length > 1 || Boolean(stage.delayMs);

/** Index of the first stage the `<img>` element cannot try on its own; `stages.length` when every stage can be. */
const firstRacedStageIndex = (stages: ImageSourceStage[], progressive: boolean) => {
  if (!progressive) return stages.some(needsRacer) ? 0 : stages.length;

  const index = stages.findIndex(needsRacer);

  return index === -1 ? stages.length : index;
};

/**
 * @arg sources // Memoize
 * @arg immediate // Start the off-DOM race right away instead of waiting for a slot under the loader's in-flight cap.
 * @arg progressive // Load the leading single-URL stages through the `<img>` element (progressive rendering, no
 * timeout, no concurrency cap) and race only the remaining stages off-DOM. Otherwise, a stack with any multi-URL or
 * delayed stage is raced off-DOM from its first stage.
 */
export const useImagesStackLoading = (
  sources: string[] | ImageSourceStage[],
  immediate = false,
  progressive = false
) => {
  const stages = useMemoWithCompare(() => normalizeImageSources(sources), [sources], areImageSourceStagesEqual);
  const emptyStack = stages.length < 1;
  const racedFrom = firstRacedStageIndex(stages, progressive);

  const prevStagesRef = useRef(stages);
  const loadGenerationRef = useRef(0);

  const [index, setIndex] = useState(emptyStack ? -1 : 0);
  const [racedSrc, setRacedSrc] = useState<string>();
  const [isLoading, setIsLoading] = useState(!emptyStack);
  const [isStackFailed, setIsStackFailed] = useState(emptyStack);

  const racing = index >= 0 && index >= racedFrom;

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

      if (racedFrom > 0) {
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
  }, [stages, racedFrom]);

  useEffect(() => {
    if (!racing || racedFrom >= stages.length) {
      return;
    }

    const controller = new AbortController();
    const generation = ++loadGenerationRef.current;

    void loadImageSourceStages(stages.slice(racedFrom), { signal: controller.signal, immediate })
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
  }, [stages, immediate, racing, racedFrom]);

  const src = index < 0 ? undefined : racing ? racedSrc : stages.at(index)?.urls.at(0);

  const onSuccess = () => void setIsLoading(false);

  const onFail = () => {
    if (isStackFailed) {
      return;
    }

    if (racing) {
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
