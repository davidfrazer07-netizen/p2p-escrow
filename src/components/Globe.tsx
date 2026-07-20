"use client";

import { useEffect, useRef } from "react";

// Ported from the-analyst's WireframeGlobe (same continent polygons, land-dot
// rasterization, and orthographic projection math), retinted neon green.

type Poly = [number, number][];

const CONTINENTS: Poly[] = [
  [[-168,65],[-150,71],[-95,72],[-80,63],[-64,60],[-60,47],[-70,43],[-81,25],[-97,18],[-106,23],[-117,32],[-125,40],[-130,54],[-140,60],[-168,65]],
  [[-46,60],[-30,70],[-20,78],[-40,83],[-58,79],[-52,68],[-46,60]],
  [[-80,9],[-62,11],[-50,0],[-35,-7],[-39,-15],[-48,-25],[-58,-35],[-66,-45],[-74,-52],[-73,-33],[-79,-14],[-81,-4],[-80,9]],
  [[-10,36],[-9,44],[-2,49],[4,51],[12,54],[24,57],[30,60],[40,60],[42,50],[30,46],[28,41],[20,40],[8,38],[-2,37],[-10,36]],
  [[-17,21],[-16,33],[10,37],[33,31],[43,12],[51,12],[42,-2],[40,-16],[33,-26],[20,-35],[15,-30],[12,-16],[8,4],[-8,5],[-17,21]],
  [[40,60],[60,68],[90,73],[140,73],[165,68],[160,60],[145,55],[142,46],[135,35],[122,28],[110,21],[100,9],[95,16],[83,8],[77,8],[72,22],[60,25],[48,30],[45,42],[42,50],[40,60]],
  [[114,-22],[130,-12],[142,-11],[150,-25],[146,-38],[135,-36],[120,-34],[114,-22]],
  [[35,32],[48,30],[60,25],[58,15],[48,12],[43,12],[35,15],[35,32]],
];

const NODES: { lon: number; lat: number; hot: boolean }[] = [
  { lon: 0, lat: 51, hot: true },
  { lon: -74, lat: 41, hot: true },
  { lon: 139, lat: 36, hot: true },
  { lon: 151, lat: -33, hot: false },
  { lon: 72, lat: 19, hot: false },
  { lon: 8.5, lat: 47, hot: true },
  { lon: 8.7, lat: 50, hot: false },
  { lon: 114, lat: 22, hot: false },
  { lon: 104, lat: 1.3, hot: false },
  { lon: 55, lat: 25, hot: true },
  { lon: -46, lat: -23, hot: false },
  { lon: 37, lat: 56, hot: true },
  { lon: 121, lat: 31, hot: true },
  { lon: 28, lat: -26, hot: false },
];

function insidePoly(x: number, y: number, poly: Poly): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function isLand(lon: number, lat: number): boolean {
  for (const poly of CONTINENTS) {
    if (insidePoly(lon, lat, poly)) return true;
  }
  return false;
}

function computeLandDots(): [number, number][] {
  const pts: [number, number][] = [];
  for (let lat = -78; lat <= 80; lat += 4.5) {
    for (let lon = -180; lon < 180; lon += 4.5) {
      if (isLand(lon, lat)) pts.push([lon, lat]);
    }
  }
  return pts;
}

// Ocean dots sit on a coarser, unaligned grid (6°) from the land dots
// (4.5°) — without excluding land points here, the two layers render
// close-but-not-identical dots over every continent, reading as
// overlapping clutter instead of one clean layer per region.
function computeOceanDots(): [number, number][] {
  const pts: [number, number][] = [];
  for (let lat = -80; lat <= 80; lat += 6) {
    for (let lon = -180; lon < 180; lon += 6) {
      if (!isLand(lon, lat)) pts.push([lon, lat]);
    }
  }
  return pts;
}

const LAND_DOTS = computeLandDots();
const OCEAN_DOTS = computeOceanDots();
const TILT = 0.42;

function project(lonDeg: number, latDeg: number, rot: number, R: number, cx: number, cy: number) {
  const la = (latDeg * Math.PI) / 180;
  const lo = (lonDeg * Math.PI) / 180 + rot;
  const x = Math.cos(la) * Math.sin(lo);
  const y = Math.sin(la);
  const z = Math.cos(la) * Math.cos(lo);
  const y2 = y * Math.cos(TILT) - z * Math.sin(TILT);
  const z2 = y * Math.sin(TILT) + z * Math.cos(TILT);
  return { x: cx + x * R, y: cy - y2 * R, z: z2 };
}

export default function WireframeGlobe({
  tint = "#39ff8a",
  speed = 0.05,
  size = 380,
  opacity = 0.95,
  className = "",
}: {
  tint?: string;
  speed?: number;
  size?: number;
  opacity?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let raf = 0;
    const hotColor = "#ff3b6b";
    const coolColor = tint;

    const draw = (t: number) => {
      const time = t / 1000;
      const rot = time * speed * 2 * Math.PI;
      const R = (size / 2) * 0.92;
      const cx = size / 2;
      const cy = size / 2;

      ctx.clearRect(0, 0, size, size);

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = hexAlpha(tint, 0.5);
      ctx.lineWidth = 1.2;
      ctx.stroke();

      for (const [oLo, oLa] of OCEAN_DOTS) {
        const { x, y, z } = project(oLo, oLa, rot, R, cx, cy);
        if (z > 0.05) {
          const r = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = hexAlpha(tint, 0.35 + z * 0.35);
          ctx.fill();
        }
      }

      for (const [lo2, la2] of LAND_DOTS) {
        const { x, y, z } = project(lo2, la2, rot, R, cx, cy);
        if (z > 0.04) {
          const s = 1.6 + z * 2.0;
          const op = 0.6 + z * 0.5;
          ctx.beginPath();
          ctx.arc(x, y, s / 2, 0, Math.PI * 2);
          ctx.fillStyle = hexAlpha(coolColor, op);
          ctx.fill();
        }
      }

      for (const n of NODES) {
        const { x, y, z } = project(n.lon, n.lat, rot, R, cx, cy);
        if (z > 0) {
          const col = n.hot ? hotColor : coolColor;
          const glow = 9 + z * 5;
          ctx.beginPath();
          ctx.arc(x, y, glow, 0, Math.PI * 2);
          ctx.fillStyle = hexAlpha(col, 0.35);
          ctx.fill();
          const r = 2.5 + z * 1.8;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = hexAlpha(col, 1);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [tint, speed, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, opacity }}
      className={className}
    />
  );
}

function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
