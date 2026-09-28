#!/usr/bin/env node
// Buffer a GeoJSON point, line or polygon by a distance.
//
// Usage: node buffer.mjs <radius> [units]
//   stdin:  a GeoJSON Feature or geometry
//   stdout: a GeoJSON Feature (Polygon or MultiPolygon)
//
// units: meters, kilometers (default), miles, etc. — anything turf's
// `buffer` accepts.
import * as turf from '@turf/turf';

const [radius, units] = [Number(process.argv[2]), process.argv[3] || 'kilometers'];
if (!Number.isFinite(radius)) {
  console.error('Usage: node buffer.mjs <radius> [units]');
  process.exit(1);
}

let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (data += chunk));
process.stdin.on('end', () => {
  const feature = JSON.parse(data);
  console.log(JSON.stringify(turf.buffer(feature, radius, { units })));
});
