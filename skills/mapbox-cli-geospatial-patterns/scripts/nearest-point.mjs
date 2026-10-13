#!/usr/bin/env node
// The nearest of a list of points to a reference point — a free
// pre-filter before an expensive `mapbox matrix` call.
//
// Usage: node nearest-point.mjs
//   stdin:  {"from": [lon,lat], "points": [[lon,lat], ...]}
//   stdout: a GeoJSON Feature: the nearest point, with
//           properties.featureIndex and properties.distanceToPoint (km)
import * as turf from '@turf/turf';

let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (data += chunk));
process.stdin.on('end', () => {
  const { from, points } = JSON.parse(data);
  const collection = turf.featureCollection(points.map((p) => turf.point(p)));
  console.log(JSON.stringify(turf.nearestPoint(turf.point(from), collection)));
});
