import { useEffect, useRef, useState } from 'react';

import { useDidUpdate, useMemoWithCompare } from 'lib/ui/hooks';
import {
  areImageSourceStagesEqual,
  ImageSourceStage,
  loadImageSourceStages,
  normalizeImageSources
} from 'lib/ui/race-image-urls';

const FAILURE_BACKOFF_BASE_MS = 5_000;
const FAILURE_BACKOFF_MAX_MS = 5 * 60_000;

interface ImagesStackLoadingOptions {
  immediate?: boolean;
  progressive?: boolean;
  raced?: boolean;
  timeoutMs?: number;
  paused?: boolean;
  failureBackoffMs?: number;
}

const needsRacer = (stage: ImageSourceStage) => stage.urls.length > 1 || Boolean(stage.delayMs);

/** Index of the first stage the `<img>` element cannot try on its own; `stages.length` when every stage can be. */
const firstRacedStageIndex = (stages: ImageSourceStage[], progressive: boolean, raced: boolean) => {
  if (raced) return 0;

  if (!progressive) return stages.some(needsRacer) ? 0 : stages.length;

  const index = stages.findIndex(needsRacer);

  return index === -1 ? stages.length : index;
};

const loadedSrcs = new Map<string, string>();
const failedStacks = new Map<string, { until: number; attempts: number }>();

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => failedStacks.clear());
}

const getStackKey = (stages: ImageSourceStage[]) => stages.flatMap(stage => stage.urls).join('\0');

const findLoadedSrc = (stages: ImageSourceStage[]) => {
  const url = loadedSrcs.get(getStackKey(stages));
  if (!url) return undefined;

  const index = stages.findIndex(stage => stage.urls.includes(url));

  return index === -1 ? undefined : { index, url };
};

const isStackRecentlyFailed = (stages: ImageSourceStage[], immediate: boolean) =>
  !immediate && (failedStacks.get(getStackKey(stages))?.until ?? 0) > Date.now();

const rememberFailedStack = (stages: ImageSourceStage[], immediate: boolean, backoffMs = FAILURE_BACKOFF_BASE_MS) => {
  if (immediate || stages.length === 0) return;

  const key = getStackKey(stages);
  const attempts = (failedStacks.get(key)?.attempts ?? 0) + 1;

  failedStacks.set(key, {
    until: Date.now() + Math.min(backoffMs * 2 ** (attempts - 1), FAILURE_BACKOFF_MAX_MS),
    attempts
  });
};

/**
 * @arg sources // Memoize
 * @arg options.immediate // Start the off-DOM race right away instead of waiting for a slot under the loader's in-flight
 * cap.
 * @arg options.progressive // Load the leading single-URL stages through the `<img>` element (progressive rendering, no
 * timeout, no concurrency cap) and race only the remaining stages off-DOM. Otherwise, a stack with any multi-URL or
 * delayed stage is raced off-DOM from its first stage.
 * @arg options.raced // Race the stack off-DOM from its first stage even when the `<img>` element could try every stage.
 * @arg options.timeoutMs // Per-attempt timeout of the off-DOM races; the racer's default when omitted.
 * @arg options.paused // Don't load while true; a load in progress is aborted, a loaded image stays.
 * @arg options.failureBackoffMs // First back-off before a failed stack is tried again on remount; ignored with
 * `immediate`.
 */
export const useImagesStackLoading = (
  sources: string[] | ImageSourceStage[],
  {
    immediate = false,
    progressive = false,
    raced = false,
    timeoutMs,
    paused = false,
    failureBackoffMs
  }: ImagesStackLoadingOptions = {}
) => {
  const stages = useMemoWithCompare(() => normalizeImageSources(sources), [sources], areImageSourceStagesEqual);
  const emptyStack = stages.length < 1;
  const racedFrom = firstRacedStageIndex(stages, progressive, raced);

  const prevStagesRef = useRef(stages);
  const loadGenerationRef = useRef(0);

  const [loadedAtMount] = useState(() => findLoadedSrc(stages));
  const [failedAtMount] = useState(() => !loadedAtMount && isStackRecentlyFailed(stages, immediate));
  const [index, setIndex] = useState(loadedAtMount?.index ?? (emptyStack || failedAtMount ? -1 : 0));
  const [racedSrc, setRacedSrc] = useState(loadedAtMount?.url);
  const [isLoading, setIsLoading] = useState(!emptyStack && !loadedAtMount && !failedAtMount);
  const [isStackFailed, setIsStackFailed] = useState(emptyStack || failedAtMount);

  const racing = index >= 0 && index >= racedFrom;

  useDidUpdate(() => {
    if (areImageSourceStagesEqual(prevStagesRef.current, stages)) {
      return;
    }

    prevStagesRef.current = stages;

    const loaded = findLoadedSrc(stages);

    if (stages.length > 0 && (loaded || !isStackRecentlyFailed(stages, immediate))) {
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
  }, [stages, racedFrom, immediate]);

  useEffect(() => {
    if (!racing || paused || racedFrom >= stages.length) return;

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
      rememberFailedStack(stages, immediate, failureBackoffMs);
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
  }, [stages, immediate, timeoutMs, racing, racedFrom, paused, failureBackoffMs]);

  const shownBeforePause = !isLoading && !isStackFailed;
  const src = index < 0 || (paused && !shownBeforePause) ? undefined : racing ? racedSrc : stages.at(index)?.urls.at(0);

  const onSuccess = () => {
    const key = getStackKey(stages);

    if (src) loadedSrcs.set(key, src);
    failedStacks.delete(key);
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
        rememberFailedStack(stages, immediate, failureBackoffMs);
      }

      return;
    }

    if (index + 1 === stages.length) {
      setIndex(-1);
      setIsLoading(false);
      setIsStackFailed(true);
      rememberFailedStack(stages, immediate, failureBackoffMs);

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
