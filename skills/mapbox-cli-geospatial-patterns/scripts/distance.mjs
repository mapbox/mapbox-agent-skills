#!/usr/bin/env node
// Straight-line ("as the crow flies") distance between two points.
//
// Usage: node distance.mjs '[lon,lat]' '[lon,lat]' [units]
//   stdout: a single number, on its own line
//
// For road/travel distance or time, use `mapbox directions` or
// `mapbox matrix` instead — this never touches the network.
import * as turf from '@turf/turf';

const [from, to, units] = [process.argv[2], process.argv[3], process.argv[4] || 'kilometers'];
if (!from || !to) {
  console.error("Usage: node distance.mjs '[lon,lat]' '[lon,lat]' [units]");
  process.exit(1);
}

console.log(turf.distance(turf.point(JSON.parse(from)), turf.point(JSON.parse(to)), { units }));
