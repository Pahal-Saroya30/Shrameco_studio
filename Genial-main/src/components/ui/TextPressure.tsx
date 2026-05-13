'use client';

import { useEffect, useRef, useState, useCallback, type CSSProperties } from 'react';
import './TextPressure.css';

type Point = { x: number; y: number };

const dist = (a: Point, b: Point) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const getAttr = (distance: number, maxDist: number, minVal: number, maxVal: number) => {
  const val = maxVal - Math.abs((maxVal * distance) / maxDist);
  return Math.max(minVal, val + minVal);
};

const debounce = (func: () => void, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func();
    }, delay);
  };
};

type TextPressureProps = {
  text?: string;
  fontFamily?: string;
  fontUrl?: string;
  flex?: boolean;
  scale?: boolean;
  alpha?: boolean;
  stroke?: boolean;
  width?: boolean;
  weight?: boolean;
  italic?: boolean;
  textColor?: string;
  strokeColor?: string;
  className?: string;
  minFontSize?: number;
};

export default function TextPressure({
  text = 'Compressa',
  fontFamily = 'Compressa VF',
  fontUrl = 'https://res.cloudinary.com/dr6lvwubh/raw/upload/v1529908256/CompressaPRO-GX.woff2',
  width = true,
  weight = true,
  italic = true,
  alpha = false,
  flex = true,
  stroke = false,
  scale = false,
  textColor = '#FFFFFF',
  strokeColor = '#FF0000',
  className = '',
  minFontSize = 24,
}: TextPressureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const spansRef = useRef<Array<HTMLSpanElement | null>>([]);

  const mouseRef = useRef<Point>({ x: 0, y: 0 });
  const cursorRef = useRef<Point>({ x: 0, y: 0 });

  const [fontSize, setFontSize] = useState(minFontSize);
  const [scaleY, setScaleY] = useState(1);
  const [lineHeight, setLineHeight] = useState(1);

  const chars = text.split('');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorRef.current.x = e.clientX;
      cursorRef.current.y = e.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      cursorRef.current.x = t.clientX;
      cursorRef.current.y = t.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    if (containerRef.current) {
      const { left, top, width: w, height: h } = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = left + w / 2;
      mouseRef.current.y = top + h / 2;
      cursorRef.current.x = mouseRef.current.x;
      cursorRef.current.y = mouseRef.current.y;
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const setSize = useCallback(() => {
    if (!containerRef.current || !titleRef.current) return;

    const { width: containerW, height: containerH } = containerRef.current.getBoundingClientRect();
    let newFontSize = containerW / (chars.length / 2);
    newFontSize = Math.max(newFontSize, minFontSize);

    setFontSize(newFontSize);
    setScaleY(1);
    setLineHeight(1);

    requestAnimationFrame(() => {
      if (!titleRef.current) return;
      const textRect = titleRef.current.getBoundingClientRect();
      if (scale && textRect.height > 0) {
        const yRatio = containerH / textRect.height;
        setScaleY(yRatio);
        setLineHeight(yRatio);
      }
    });
  }, [chars.length, minFontSize, scale]);

  useEffect(() => {
    const debouncedSetSize = debounce(setSize, 100);
    debouncedSetSize();
    window.addEventListener('resize', debouncedSetSize);
    return () => window.removeEventListener('resize', debouncedSetSize);
  }, [setSize]);

  useEffect(() => {
    let rafId = 0;
    const animate = () => {
      mouseRef.current.x += (cursorRef.current.x - mouseRef.current.x) / 15;
      mouseRef.current.y += (cursorRef.current.y - mouseRef.current.y) / 15;

      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect();
        const maxDist = titleRect.width / 2;

        spansRef.current.forEach((span) => {
          if (!span) return;

          const rect = span.getBoundingClientRect();
          const charCenter = {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
          };

          const d = dist(mouseRef.current, charCenter);

          const wdth = width ? Math.floor(getAttr(d, maxDist, 5, 200)) : 100;
          const wght = weight ? Math.floor(getAttr(d, maxDist, 100, 900)) : 400;
          const italVal = italic ? getAttr(d, maxDist, 0, 1).toFixed(2) : '0';
          const alphaVal = alpha ? getAttr(d, maxDist, 0, 1).toFixed(2) : '1';
          const newSettings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`;

          if (span.style.fontVariationSettings !== newSettings) {
            span.style.fontVariationSettings = newSettings;
          }
          if (alpha && span.style.opacity !== alphaVal) {
            span.style.opacity = alphaVal;
          }
        });
      }

      rafId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(rafId);
  }, [width, weight, italic, alpha]);

  const dynamicClassName = ['text-pressure-title', className, flex ? 'tp-flex' : '', stroke ? 'tp-stroke' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className="text-pressure-container"
      style={
        {
          '--tp-text-color': textColor,
          '--tp-stroke-color': strokeColor,
        } as CSSProperties
      }
    >
      {fontUrl ? (
        <style>{`
          @font-face {
            font-family: '${fontFamily}';
            src: url('${fontUrl}');
            font-style: normal;
          }
        `}</style>
      ) : null}
      <h1
        ref={titleRef}
        className={dynamicClassName}
        style={{
          fontFamily,
          fontSize,
          lineHeight,
          transform: `scale(1, ${scaleY})`,
          transformOrigin: 'center top',
        }}
      >
        {chars.map((char, i) => (
          <span
            key={`${char}-${i}`}
            ref={(el) => {
              spansRef.current[i] = el;
            }}
            data-char={char}
            style={{
              display: 'inline-block',
              color: stroke ? undefined : textColor,
            }}
          >
            {char}
          </span>
        ))}
      </h1>
    </div>
  );
}
