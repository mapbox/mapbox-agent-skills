# Use Cases by Application Type

## Real Estate App (Zillow-style)

```typescript
// Find properties with good commute
async findPropertiesByCommute(
  searchArea: Polygon,
  workLocation: Point,
  maxCommuteMinutes: number
) {
  // 1. Get isochrone from work
  const reachableArea = await mcp.callTool('isochrone_tool', {
    coordinates: { longitude: workLocation[0], latitude: workLocation[1] },
    contours_minutes: [maxCommuteMinutes],
    profile: 'mapbox/driving'
  });

  // 2. Check each property
  const propertiesInRange = [];
  for (const property of properties) {
    const inRange = await mcp.callTool('point_in_polygon_tool', {
      point: { longitude: property.location[0], latitude: property.location[1] },
      polygon: reachableArea
    });

    if (inRange) {
      // 3. Get exact commute time
      const directions = await mcp.callTool('directions_tool', {
        coordinates: [property.location, workLocation],
        routing_profile: 'mapbox/driving-traffic'
      });

      propertiesInRange.push({
        ...property,
        commuteTime: directions.duration / 60
      });
    }
  }

  return propertiesInRange;
}
```

## Food Delivery App (DoorDash-style)

```typescript
// Check if restaurant can deliver to address
async canDeliver(
  restaurantLocation: Point,
  deliveryAddress: Point,
  maxDeliveryTime: number
) {
  // 1. Calculate delivery zone
  const deliveryZone = await mcp.callTool('isochrone_tool', {
    coordinates: restaurantLocation,
    contours_minutes: [maxDeliveryTime],
    profile: 'mapbox/driving'
  });

  // 2. Check if address is in zone
  const canDeliver = await mcp.callTool('point_in_polygon_tool', {
    point: deliveryAddress,
    polygon: deliveryZone
  });

  if (!canDeliver) return false;

  // 3. Get accurate delivery time
  const route = await mcp.callTool('directions_tool', {
    coordinates: [restaurantLocation, deliveryAddress],
    routing_profile: 'mapbox/driving-traffic'
  });

  return {
    canDeliver: true,
    estimatedTime: route.duration / 60,
    distance: route.distance
  };
}
```

## Travel Planning App (TripAdvisor-style)

```typescript
// Build day itinerary with travel times
async buildItinerary(
  hotel: Point,
  attractions: Array<{name: string, location: Point}>
) {
  // 1. Calculate distances from hotel
  const attractionsWithDistance = await Promise.all(
    attractions.map(async (attr) => ({
      ...attr,
      distance: await mcp.callTool('distance_tool', {
        from: hotel,
        to: attr.location,
        units: 'miles'
      })
    }))
  );

  // 2. Get travel time matrix
  const matrix = await mcp.callTool('matrix_tool', {
    origins: [hotel],
    destinations: attractions.map(a => a.location),
    profile: 'mapbox/walking'
  });

  // 3. Sort by walking time
  return attractionsWithDistance
    .map((attr, idx) => ({
      ...attr,
      walkingTime: matrix.durations[0][idx] / 60
    }))
    .sort((a, b) => a.walkingTime - b.walkingTime);
}
```
