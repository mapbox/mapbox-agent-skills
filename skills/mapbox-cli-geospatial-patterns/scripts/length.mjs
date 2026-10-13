#!/usr/bin/env node
// The length of a line — for a route or GPS trace geometry, not a
// straight-line distance between two points (use distance.mjs for that).
//
// Usage: node length.mjs [units]
//   stdin:  a GeoJSON LineString/MultiLineString Feature or geometry
//   stdout: a single number, on its own line
import * as turf from '@turf/turf';

const units = process.argv[2] || 'kilometers';

let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (data += chunk));
process.stdin.on('end', () => console.log(turf.length(JSON.parse(data), { units })));
