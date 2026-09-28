---
name: mapbox-cli-geospatial-patterns
description: How to chain the mapbox CLI with local Turf.js geometry scripts in a shell pipeline, so a script or agent can combine Mapbox's routing/search data with free, instant geometric operations. Use when writing a bash script, CI job, or agent task that needs both Mapbox data and geometry math (buffering, containment, nearest-point, area) without a Node project or the MCP server.
---

# Mapbox CLI + Turf.js Patterns

Guidance for chaining the `mapbox` CLI (JSON in, JSON out) with small, local
Turf.js scripts, for a shell script, CI job, or coding agent that has the
CLI installed but isn't calling the Mapbox MCP server's tools directly. If
an MCP server is available, use
[`mapbox-geospatial-operations`](../mapbox-geospatial-operations/SKILL.md)
instead — same decision framework, but as MCP tool calls rather than shell
pipes. This skill exists for the case that skill doesn't cover: no MCP
server, just a CLI and a shell.

## Core principle

`mapbox` for anything that needs Mapbox's own data: routing, traffic,
geocoding, search results, map tiles. Turf for anything that's pure
geometry on GeoJSON you already have: buffering, containment, distance,
centroid, area. Every `mapbox` command that returns a result prints GeoJSON
or a GeoJSON-shaped object to stdout with `-o json`, which is exactly what
every script here reads from stdin — the whole pattern is
`mapbox ... -o json | node scripts/<op>.mjs ...`.

**Don't reach for `turf-cli` on npm.** It's a single-maintainer package
last published years ago against Turf 2.x, a different, incompatible API
from the current `@turf/turf` (7.x). The scripts in `scripts/` here use the
current package instead.

## Setup (once per checkout)

```sh
cd scripts && npm install
```

This installs `@turf/turf` locally. Nothing here needs a Mapbox token,
a Node project of the caller's own, or network access beyond that one
install.

## The scripts

Each reads GeoJSON (or a small JSON object naming its inputs) from stdin,
writes GeoJSON (or a number) to stdout, and does nothing else — no
network, no files. Read a script's own header comment for its exact input
shape before using it; they're short.

| Script                                         | What it computes                                     | Typical input                        |
| ---------------------------------------------- | ---------------------------------------------------- | ------------------------------------ |
| `buffer.mjs <radius> [units]`                  | A polygon within `radius` of a point/line/polygon    | one Feature/geometry                 |
| `distance.mjs '[lon,lat]' '[lon,lat]' [units]` | Straight-line distance                               | two points as args, nothing on stdin |
| `points-within-polygon.mjs`                    | Which points fall inside a polygon                   | `{points, polygon}`                  |
| `nearest-point.mjs`                            | The closest of a list of points to a reference point | `{from, points}`                     |
| `centroid.mjs`                                 | The geometric center of a shape                      | one Feature/geometry                 |
| `length.mjs [units]`                           | The length of a line                                 | one LineString Feature/geometry      |

## Common Scenarios

### Scenario 1: Store locator — which locations are actually reachable

**Problem:** "Which of our stores can this customer reach in a 10-minute
walk?" A straight-line radius overcounts (it doesn't know about one-way
streets, water, highways); calling `mapbox directions` once per store is
slow and wasteful.

**Approach:** one `mapbox isochrone` call for the travel-time zone, one
`mapbox search category` call for candidate stores, then a free geometric
containment check.

```sh
mapbox isochrone mapbox/walking "-122.42,37.78" --contours-minutes 10 --polygons -o json \
  | jq '.features[0]' > /tmp/zone.geojson

mapbox search category coffee_shop --proximity "-122.42,37.78" --limit 10 -o json \
  | jq '{points: [.features[].geometry.coordinates]}' \
  | jq --slurpfile zone /tmp/zone.geojson '. + {polygon: $zone[0]}' \
  | node scripts/points-within-polygon.mjs
```

**Why this order:** routing (`isochrone`) only runs once, for the zone; the
per-candidate check is geometric and instant, however many candidates
there are.

### Scenario 2: Pre-filter before an expensive matrix call

**Problem:** ranking 200 candidates by real travel time, but `mapbox
matrix` tops out at 25 coordinates per call and every call costs a
request.

**Approach:** `distance.mjs` (free, instant) narrows 200 candidates to the
nearest ~20 by straight-line distance; `mapbox matrix` ranks only those by
actual travel time.

```sh
# candidates.json: [[lon,lat], ...] from wherever they came from
jq -c '.[]' candidates.json | while read -r point; do
  d=$(node scripts/distance.mjs '[-122.42,37.78]' "$point")
  echo "$d $point"
done | sort -n | head -20 | awk '{print $2}' > nearest-20.json
```

Straight-line distance is never larger than road distance, so this never
drops a candidate that would have ranked in the true top 20 by a wide
enough margin to matter in practice — it's a pre-filter, not the final
answer. Feed the narrowed list's coordinates to `mapbox matrix` for the
real ranking.

### Scenario 3: Search-along-route

**Problem:** "Find gas stations along this route," not just near either
endpoint.

**Approach:** `mapbox directions` for the route geometry, `buffer.mjs` to
turn it into a corridor, then filter candidates against the corridor the
same way as Scenario 1.

```sh
mapbox directions mapbox/driving "-122.42,37.78;-122.10,37.65" --geometries geojson -o json \
  | jq '.routes[0].geometry' \
  | node scripts/buffer.mjs 1 kilometers > /tmp/corridor.geojson
```

`search --route`/`--route-geometry` (search-along-route) can also do this
server-side for search results specifically — prefer that when the
candidates are themselves Mapbox Search results; reach for the buffer
approach when filtering your own dataset instead.

### Scenario 4: Trip length after cleaning a GPS trace

**Problem:** "How far did this bike ride actually go?" A raw GPS trace's
own length is noisy — it wanders off the actual path with every position
error.

**Approach:** `mapbox map-matching` snaps the trace to the road/path
network first; only then is `length.mjs` on the _matched_ geometry a real
distance.

```sh
mapbox map-matching mapbox/cycling "$(cat trace.txt)" --geometries geojson -o json \
  | jq '.matchings[0].geometry' \
  | node scripts/length.mjs kilometers
```

### Scenario 5: Reverse-geocode an area, not a point

**Problem:** naming "roughly where" a drawn region or a cluster of asset
locations is, when there's no single point to reverse-geocode.

**Approach:** `centroid.mjs` first, then `mapbox geocoder reverse` on that
point.

```sh
node scripts/centroid.mjs < region.geojson \
  | jq -r '.geometry.coordinates | "--longitude \(.[0]) --latitude \(.[1])"' \
  | xargs mapbox geocoder reverse
```

## Anti-patterns

**Don't call a routing command in a loop to check containment.** If the
question is "is X inside this zone" for many X, get the zone once
(`isochrone`, `directions` + `buffer`) and check every candidate with
`points-within-polygon.mjs` — not one `directions`/`isochrone` call per
candidate.

**Don't use straight-line distance where the question means road
distance.** `distance.mjs` answers "as the crow flies." If the actual
question is drive time, walk time, or road distance, that's `mapbox
directions` or `mapbox matrix`, not this skill's scripts. See
[`mapbox-geospatial-operations`](../mapbox-geospatial-operations/SKILL.md)'s
terminology guide for the "distance" ambiguity in general.

**Don't reach for `turf-cli`.** See Setup above.

## Resources

- [Turf.js documentation](https://turfjs.org/)
- [`mapbox-geospatial-operations`](../mapbox-geospatial-operations/SKILL.md) — the same tool-choice framework, as MCP tool calls
- [mapbox-cli](https://github.com/mapbox/mapbox-cli)
