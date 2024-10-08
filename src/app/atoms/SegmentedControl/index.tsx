import React, { useRef, useEffect, RefObject, CSSProperties } from 'react';

import clsx from 'clsx';

import styles from './styles.module.css';

interface Segment<T extends string> {
  label: string;
  value: T;
  ref: RefObject<HTMLDivElement>;
}

interface SegmentedControlProps<T extends string> {
  name: string;
  segments: Segment<T>[];
  activeSegment: T;
  setActiveSegment: (value: T) => void;
  controlRef: RefObject<HTMLDivElement>;
  className?: string;
  style?: CSSProperties;
}

const SegmentedControl = <T extends string>({
  name,
  segments,
  activeSegment,
  setActiveSegment,
  controlRef,
  className,
  style
}: SegmentedControlProps<T>) => {
  const componentReady = useRef<boolean>();

  // Determine when the component is "ready"
  useEffect(() => {
    componentReady.current = true;
  }, []);

  useEffect(() => {
    const activeSegmentRef = segments.find(segment => segment.value === activeSegment)?.ref;

    if (activeSegmentRef?.current && controlRef.current) {
      const { offsetWidth, offsetLeft } = activeSegmentRef.current;
      const { style } = controlRef.current;

      style.setProperty('--highlight-width', `${offsetWidth}px`);
      style.setProperty('--highlight-x-pos', `${offsetLeft}px`);
    }
  }, [activeSegment, controlRef, segments]);

  return (
    <div ref={controlRef} className={clsx(styles.controlsContainer, className)} style={style}>
      <div className={clsx(styles.controls, componentReady.current ? styles.ready : styles.idle)}>
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
