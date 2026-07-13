# Testing and Monitoring

## Testing Strategy

### Unit Tests

```javascript
// Mock fetch for testing
global.fetch = jest.fn();

describe('MapboxSearch', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('debounces search requests', async () => {
    const search = new MapboxSearch('fake-token');

    // Rapid-fire searches
    search.search('san');
    search.search('san f');
    search.search('san fr');
    search.search('san francisco');

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Should only make one API call
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('handles empty results', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: [] })
    });

    const search = new MapboxSearch('fake-token');
    const results = await search.performSearch('xyz');

    expect(results).toEqual([]);
  });

  test('handles API errors', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 429
    });

    const search = new MapboxSearch('fake-token');
    const results = await search.performSearch('test');

    expect(results).toEqual([]);
  });
});
```

### Integration Tests

```javascript
describe('Search Integration', () => {
  test('complete search flow', async () => {
    const search = new MapboxSearch(process.env.MAPBOX_TOKEN);

    // Perform search
    const suggestions = await search.performSearch('San Francisco');
    expect(suggestions.length).toBeGreaterThan(0);

    // Retrieve first result
    const feature = await search.retrieve(suggestions[0].mapbox_id);
    expect(feature.geometry.coordinates).toBeDefined();
    expect(feature.properties.name).toBe('San Francisco');
  });
});
```

## Monitoring and Analytics

### Track Key Metrics

```javascript
// Track search usage
function trackSearch(query, resultsCount) {
  analytics.track('search_performed', {
    query_length: query.length,
    results_count: resultsCount,
    had_results: resultsCount > 0
  });
}

// Track selections
function trackSelection(result, position) {
  analytics.track('search_result_selected', {
    result_type: result.feature_type,
    result_position: position,
    had_address: !!result.properties.full_address
  });
}

// Track errors
function trackError(errorType, query) {
  analytics.track('search_error', {
    error_type: errorType,
    query_length: query.length
  });
}
```

### Monitor for Issues

- Zero-result rate (should be < 20%)
- Average response time
- Error rate
- Selection rate (users selecting vs abandoning)
- API usage vs budget
