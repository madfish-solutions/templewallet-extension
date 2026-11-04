import { useEffect, useRef, useState } from 'react';

import { useDidUpdate, useMemoWithCompare } from 'lib/ui/hooks';
import {
  areImageSourceStagesEqual,
  getImageStackRateLimitRetryAt,
  ImageSourceStage,
  loadImageSourceStages,
  normalizeImageSources
} from 'lib/ui/race-image-urls';

const RATE_LIMIT_RETRY_JITTER_MS = 5_000;
const RATE_LIMIT_MAX_WAIT_MS = 2 * 60_000;

const needsRacer = (stage: ImageSourceStage) => stage.urls.length > 1 || Boolean(stage.delayMs);

/** Index of the first stage the `<img>` element cannot try on its own; `stages.length` when every stage can be. */
const firstRacedStageIndex = (stages: ImageSourceStage[], progressive: boolean) => {
  if (!progressive) return stages.some(needsRacer) ? 0 : stages.length;

  const index = stages.findIndex(needsRacer);

  return index === -1 ? stages.length : index;
};

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
 * @arg immediate // Start the off-DOM race right away instead of waiting for a slot under the loader's in-flight cap.
 * @arg progressive // Load the leading single-URL stages through the `<img>` element (progressive rendering, no
 * timeout, no concurrency cap) and race only the remaining stages off-DOM. Otherwise, a stack with any multi-URL or
 * delayed stage is raced off-DOM from its first stage.
 * @arg timeoutMs // Per-attempt timeout of the off-DOM races; the racer's default when omitted.
 */
export const useImagesStackLoading = (
  sources: string[] | ImageSourceStage[],
  immediate = false,
  progressive = false,
  timeoutMs?: number
) => {
  const stages = useMemoWithCompare(() => normalizeImageSources(sources), [sources], areImageSourceStagesEqual);
  const emptyStack = stages.length < 1;
  const racedFrom = firstRacedStageIndex(stages, progressive);

  const prevStagesRef = useRef(stages);
  const loadGenerationRef = useRef(0);

  const [loadedAtMount] = useState(() => findLoadedSrc(stages));
  const [index, setIndex] = useState(loadedAtMount?.index ?? (emptyStack ? -1 : 0));
  const [racedSrc, setRacedSrc] = useState(loadedAtMount?.url);
  const [isLoading, setIsLoading] = useState(!emptyStack && !loadedAtMount);
  const [isStackFailed, setIsStackFailed] = useState(emptyStack);
  const [rateLimitRetryAt, setRateLimitRetryAt] = useState<number>();
  const retriedAfterRateLimitRef = useRef(false);
  const rateLimitWaitStartRef = useRef(0);

  const racing = index >= 0 && index >= racedFrom;

  useDidUpdate(() => {
    if (areImageSourceStagesEqual(prevStagesRef.current, stages)) {
      return;
    }

    prevStagesRef.current = stages;
    retriedAfterRateLimitRef.current = false;
    setRateLimitRetryAt(undefined);

    if (stages.length > 0) {
      const loaded = findLoadedSrc(stages);

      setIndex(loaded?.index ?? 0);
      setRacedSrc(loaded?.url);
      setIsLoading(!loaded);
      setIsStackFailed(false);

      if (!loaded && racedFrom > 0) {
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
    if (!racing || racedFrom >= stages.length) return;

    const controller = new AbortController();
    const generation = ++loadGenerationRef.current;
    const loaded = findLoadedSrc(stages);
    const racedStages = stages.slice(racedFrom);
    const load: ReturnType<typeof loadImageSourceStages> = loaded
      ? Promise.resolve(loaded.url)
      : loadImageSourceStages(racedStages, { signal: controller.signal, immediate, timeoutMs });

    const fail = () => {
      setRacedSrc(undefined);
      setIndex(-1);
      setIsLoading(false);
      setIsStackFailed(true);

      if (retriedAfterRateLimitRef.current) return;

      rateLimitWaitStartRef.current = Date.now();
      setRateLimitRetryAt(getImageStackRateLimitRetryAt(racedStages));
    };

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

        fail();
      })
      .catch(() => {
        if (controller.signal.aborted || generation !== loadGenerationRef.current) {
          return;
        }

        fail();
      });

    return () => {
      loadGenerationRef.current += 1;
      controller.abort();
    };
  }, [stages, immediate, timeoutMs, racing, racedFrom]);

  useEffect(() => {
    if (rateLimitRetryAt === undefined) return;

    const controller = new AbortController();
    const retryDelay = Math.max(0, rateLimitRetryAt - Date.now()) + Math.random() * RATE_LIMIT_RETRY_JITTER_MS;
    const timeoutId = setTimeout(() => {
      const racedStages = stages.slice(racedFrom);
      const dueAt = getImageStackRateLimitRetryAt(racedStages);

      if (
        dueAt !== undefined &&
        dueAt > Date.now() &&
        Date.now() - rateLimitWaitStartRef.current < RATE_LIMIT_MAX_WAIT_MS
      ) {
        setRateLimitRetryAt(dueAt);

        return;
      }

      retriedAfterRateLimitRef.current = true;

      void loadImageSourceStages(racedStages, {
        signal: controller.signal,
        immediate,
        timeoutMs,
        afterRateLimit: true
      })
        .then(winner => {
          if (controller.signal.aborted) return;

          if (winner) {
            setRacedSrc(winner);
            setIndex(racedFrom);
            setIsLoading(false);
            setIsStackFailed(false);
          }

          setRateLimitRetryAt(undefined);
        })
        .catch(() => {
          if (!controller.signal.aborted) setRateLimitRetryAt(undefined);
        });
    }, retryDelay);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [rateLimitRetryAt, stages, immediate, timeoutMs, racedFrom]);

  const src = index < 0 ? undefined : racing ? racedSrc : stages.at(index)?.urls.at(0);

  const onSuccess = () => {
    if (src) loadedSrcs.set(getStackKey(stages), src);
    setIsLoading(false);
  };

  const onFail = () => {
    if (isStackFailed) {
      return;
    }

    if (src) loadedSrcs.delete(getStackKey(stages));

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
