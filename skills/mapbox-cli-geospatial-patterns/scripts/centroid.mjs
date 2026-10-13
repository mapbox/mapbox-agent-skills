#!/usr/bin/env node
// The geometric center of a shape — useful for reverse-geocoding an
// area (a drawn region, a convex hull, a set of asset locations) rather
// than a single point.
//
// Usage: node centroid.mjs
//   stdin:  a GeoJSON Feature or geometry
//   stdout: a GeoJSON Point Feature
import * as turf from '@turf/turf';

let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (data += chunk));
process.stdin.on('end', () => console.log(JSON.stringify(turf.centroid(JSON.parse(data)))));
