import React, { useRef, useState, useEffect, FC, RefObject, CSSProperties, MutableRefObject } from 'react';

import clsx from 'clsx';

import styles from './styles.module.css';

interface Segment {
  label: string;
  value: string;
  ref: RefObject<HTMLDivElement>;
}

interface Props {
  name: string;
  segments: Segment[];
  setActiveSegment: (value: string, index: number) => void;
  controlRef: RefObject<HTMLDivElement>;
  defaultIndex?: number;
  activeIndexRef?: MutableRefObject<number | null>;
  className?: string;
  style?: CSSProperties;
}

const SegmentedControl: FC<Props> = ({
  name,
  segments,
  setActiveSegment,
  defaultIndex = 0,
  activeIndexRef,
  controlRef,
  className,
  style
}) => {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const componentReady = useRef<boolean>();

  useEffect(() => {
    if (activeIndexRef?.current) {
      setActiveIndex(activeIndexRef.current);
      activeIndexRef.current = null;
    }
  }, [activeIndexRef?.current]);

  // Determine when the component is "ready"
  useEffect(() => {
    componentReady.current = true;
  }, []);

  useEffect(() => {
    const activeSegmentRef = segments[activeIndex].ref;

    if (activeSegmentRef.current && controlRef.current) {
      const { offsetWidth, offsetLeft } = activeSegmentRef.current;
      const { style } = controlRef.current;

      style.setProperty('--highlight-width', `${offsetWidth}px`);
      style.setProperty('--highlight-x-pos', `${offsetLeft}px`);
    }
  }, [activeIndex, controlRef, segments]);

  const onInputChange = (value: string, index: number) => {
    setActiveIndex(index);
    setActiveSegment(value, index);
  };

  return (
    <div ref={controlRef} className={clsx(styles.controlsContainer, className)} style={style}>
      <div className={clsx(styles.controls, componentReady.current ? styles.ready : styles.idle)}>
        {segments?.map((item, i) => (
          <div
            key={item.value}
            className={clsx(styles.segment, i === activeIndex ? styles.active : styles.inactive)}
            ref={item.ref}
          >
            <input
              type="radio"
              value={item.value}
              id={item.label}
              name={name}
              onChange={() => onInputChange(item.value, i)}
              checked={i === activeIndex}
            />
            <label htmlFor={item.label}>{item.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SegmentedControl;
