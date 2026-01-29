/**
 * Mock restaurant data generator for performance testing
 *
 * Generates random restaurants in the San Francisco Bay Area
 * for testing clustering and performance optimization
 */

const cuisines = [
  'Italian', 'Chinese', 'Japanese', 'Mexican', 'Thai',
  'French', 'Indian', 'American', 'Mediterranean', 'Korean',
  'Vietnamese', 'Greek', 'Spanish', 'Brazilian', 'Ethiopian'
];

const adjectives = [
  'Golden', 'Blue', 'Red', 'Green', 'Silver',
  'Happy', 'Lucky', 'Royal', 'Grand', 'Little',
  'Big', 'Old', 'New', 'Modern', 'Classic'
];

const nouns = [
  'Dragon', 'Phoenix', 'Garden', 'Palace', 'House',
  'Kitchen', 'Bistro', 'Cafe', 'Grill', 'Tavern',
  'Restaurant', 'Eatery', 'Diner', 'Lounge', 'Bar'
];

// San Francisco Bay Area bounds
const SF_BOUNDS = {
  minLng: -122.52,
  maxLng: -122.35,
  minLat: 37.70,
  maxLat: 37.85
};

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRestaurantName() {
  const adj = randomFrom(adjectives);
  const noun = randomFrom(nouns);
  const cuisine = randomFrom(cuisines);
  return `${adj} ${noun} ${cuisine}`;
}

export function generateRestaurants(count = 5000) {
  console.log(`Generating ${count} mock restaurants...`);
  const startTime = performance.now();

  const restaurants = [];

  for (let i = 0; i < count; i++) {
    const lng = randomInRange(SF_BOUNDS.minLng, SF_BOUNDS.maxLng);
    const lat = randomInRange(SF_BOUNDS.minLat, SF_BOUNDS.maxLat);
    const cuisine = randomFrom(cuisines);

    restaurants.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      properties: {
        id: i,
        name: generateRestaurantName(),
        cuisine: cuisine,
        rating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0
        priceRange: '$'.repeat(Math.floor(Math.random() * 3) + 1) // $, $$, $$$
      }
    });
  }

  const duration = Math.round(performance.now() - startTime);
  console.log(`Generated ${count} restaurants in ${duration}ms`);

  return restaurants;
}
