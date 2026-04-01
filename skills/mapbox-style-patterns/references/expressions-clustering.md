# Expression Patterns and Clustering

## Expression Pattern: Data-Driven Styling

```json
{
  "paint": {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["get", "population"],
      0,
      3,
      1000,
      5,
      10000,
      8,
      100000,
      12,
      1000000,
      20
    ],
    "circle-color": [
      "case",
      ["<", ["get", "temperature"], 0],
      "#2196f3",
      ["<", ["get", "temperature"], 20],
      "#4caf50",
      ["<", ["get", "temperature"], 30],
      "#ffc107",
      "#f44336"
    ]
  }
}
```

## Clustering Pattern: Handle Dense POIs

```json
{
  "id": "clusters",
  "type": "circle",
  "source": "pois",
  "filter": ["has", "point_count"],
  "paint": {
    "circle-color": [
      "step",
      ["get", "point_count"],
      "#51bbd6", 10,
      "#f1f075", 30,
      "#f28cb1"
    ],
    "circle-radius": [
      "step",
      ["get", "point_count"],
      15, 10,
      20, 30,
      25
    ]
  }
},
{
  "id": "cluster-count",
  "type": "symbol",
  "source": "pois",
  "filter": ["has", "point_count"],
  "layout": {
    "text-field": ["get", "point_count_abbreviated"],
    "text-size": 12
  }
}
```
