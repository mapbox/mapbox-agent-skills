#!/usr/bin/env node
// Filter a list of points down to the ones inside a polygon — the
// geometric half of "which of these addresses are in the delivery zone".
//
// Usage: node points-within-polygon.mjs
//   stdin:  {"points": [[lon,lat], ...], "polygon": <GeoJSON Feature/geometry>}
//   stdout: a GeoJSON FeatureCollection of just the points that are inside
//
// `polygon` is typically the output of `mapbox isochrone` or `buffer.mjs`.
import * as turf from '@turf/turf';

let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (data += chunk));
process.stdin.on('end', () => {
  const { points, polygon } = JSON.parse(data);
  const collection = turf.featureCollection(points.map((p) => turf.point(p)));
  console.log(JSON.stringify(turf.pointsWithinPolygon(collection, polygon)));
});
