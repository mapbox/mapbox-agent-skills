# Angular Integration

**Pattern: ngOnInit + ngOnDestroy with SSR handling**

```typescript
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: false })
  mapContainer!: ElementRef<HTMLDivElement>;

  private map: any;
  private readonly platformId = inject(PLATFORM_ID);

  async ngOnInit(): Promise<void> {
    // IMPORTANT: Check if running in browser (not SSR)
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      await this.initializeMap();
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  }

  private async initializeMap(): Promise<void> {
    // Dynamically import to avoid SSR issues
    const mapboxgl = (await import('mapbox-gl')).default;

    this.map = new mapboxgl.Map({
      accessToken: environment.mapboxAccessToken,
      container: this.mapContainer.nativeElement,
      center: [-71.05953, 42.3629],
      zoom: 13
    });

    // Handle map errors
    this.map.on('error', (e: any) => console.error('Map error:', e.error));
  }

  // CRITICAL: Clean up on component destroy
  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
```

**Template (map.component.html):**

```html
<div #mapContainer style="height: 100vh; width: 100%"></div>
```

**Key points:**

- Use `@ViewChild` to reference map container
- **Check `isPlatformBrowser` before initializing** (SSR support)
- **Dynamically import `mapbox-gl`** to avoid SSR issues
- Initialize in `ngOnInit()` lifecycle hook
- **Always implement `ngOnDestroy()`** to call `map.remove()`
- Handle errors with `map.on('error', ...)`
