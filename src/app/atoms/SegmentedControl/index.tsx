import React, { useEffect, RefObject, CSSProperties, useRef } from 'react';

import clsx from 'clsx';

import styles from './styles.module.css';

interface Segment<T extends string> {
  label: string;
  value: T;
  ref: RefObject<HTMLDivElement | null>;
}

interface SegmentedControlProps<T extends string> {
  name: string;
  segments: Segment<T>[];
  activeSegment: T;
  setActiveSegment: SyncFn<T>;
  className?: string;
  controlsClassName?: string;
  style?: CSSProperties;
}

const SegmentedControl = <T extends string>({
  name,
  segments,
  activeSegment,
  setActiveSegment,
  className,
  controlsClassName,
  style
}: SegmentedControlProps<T>) => {
  const controlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeSegmentRef = segments.find(segment => segment.value === activeSegment)?.ref;
    const controlEl = controlRef.current;
    const activeEl = activeSegmentRef?.current;

    if (!controlEl || !activeEl) return;

    const { offsetWidth, offsetLeft } = activeEl;

    // Prevent highlight changes if control is hidden
    if (offsetWidth === 0) return;

    const { style } = controlEl;
    style.setProperty('--highlight-width', `${offsetWidth}px`);
    style.setProperty('--highlight-x-pos', `${offsetLeft}px`);
  }, [activeSegment, segments]);

  return (
    <div ref={controlRef} className={clsx(styles.controlsContainer, className)} style={style}>
      <div className={clsx(styles.controls, controlsClassName)}>
        {segments?.map(item => (
          <div
            key={item.value}
            className={clsx(styles.segment, item.value === activeSegment ? styles.active : styles.inactive)}
            ref={item.ref}
          >
            <input
              type="radio"
              value={item.value}
              id={item.label}
              name={name}
              onChange={() => setActiveSegment(item.value)}
              checked={item.value === activeSegment}
            />
            <label htmlFor={item.label}>{item.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SegmentedControl;
