# Navigation SDK v3 on a `MapboxMap` composable

How to move a Navigation SDK v3 screen from the View system to Compose, using public, published APIs only. Load `maps.md` too: the map itself follows the Maps mappings.

**What doesn't change:** `MapboxNavigation`, routing, trip session, observers, the route line, arrow, maneuver, trip progress and voice APIs. They are the same objects with the same calls. What changes is where they're created, where they get the `MapView` from, and how their output reaches the UI.

**What Navigation v3 doesn't provide:** published Navigation v3 artifacts ship no Compose UI components, and the drop-in `NavigationView` was removed in v3. The UI components below are Android Views. The public [navigation examples](https://github.com/mapbox/mapbox-navigation-android-examples) include a Jetpack Compose example (`standalone/compose/JetpackComposeActivity.kt`) that follows the patterns on this page.

## Inventory search list

| Area          | Search for                                                                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lifecycle     | `MapboxNavigationApp`, `requireMapboxNavigation`, `MapboxNavigationObserver`, `MapboxNavigationProvider`                                                                                                                                         |
| Map glue      | `NavigationLocationProvider`, `setLocationProvider`, `MapboxNavigationViewportDataSource`, `NavigationCamera`, `NavigationBasicGesturesHandler`                                                                                                  |
| Route line    | `MapboxRouteLineApi`, `MapboxRouteLineView`, `MapboxRouteArrowApi`, `MapboxRouteArrowView`, `initializeLayers`                                                                                                                                   |
| Observers     | `register*Observer` (route progress, location, routes, trip session, banner and voice instructions), `addOnMapClickListener` for route selection                                                                                                 |
| UI components | `MapboxManeuverView`, `MapboxTripProgressView`, `MapboxSoundButton`, `MapboxAudioGuidanceButton`, `MapboxRecenterButton`, `MapboxRouteOverviewButton`, `MapboxCameraModeButton`, `MapboxSpeedInfoView`, `MapboxRoadNameView`, `MapboxStatusView` |
| Cleanup       | `cancel()` on APIs and views, `shutdown()` on the voice player, `onDestroy`                                                                                                                                                                      |

## Lifecycle

Keep `MapboxNavigation` attached to the Activity (or another `LifecycleOwner`), exactly as before. Compose doesn't change this.

| View system                                                                                                                                        | Compose target                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `by requireMapboxNavigation(onResumedObserver = ..., onInitialize = { MapboxNavigationApp.setup(...) })` on the Activity                           | Unchanged. The Activity now calls `setContent { }` instead of `setContentView`.                                                                                 |
| `MapboxNavigationObserver.onAttached` registers observers, `onDetached` unregisters                                                                | Unchanged. The observers write to Compose state instead of updating views (see Observers).                                                                      |
| APIs created as Activity or Fragment fields (`MapboxRouteLineApi`, `MapboxRouteLineView`, `MapboxManeuverApi`, `MapboxSpeechApi`, voice player)    | Keep them outside composition: Activity fields, a ViewModel, or a plain state holder. **Don't create them in a composable** or in a `MapEffect` that can rerun. |
| `onDestroy`: `maneuverApi.cancel()`, `routeLineApi.cancel()`, `routeLineView.cancel()`, `speechApi.cancel()`, `voiceInstructionsPlayer.shutdown()` | Unchanged, in the owner's `onDestroy` (or `ViewModel.onCleared`). `MapboxRouteArrowView` has no `cancel()`.                                                     |

A Fragment-hosted navigation screen can move to `ComposeView` inside the same Fragment first, keeping the Fragment's lifecycle. Moving to an Activity or a Compose navigation destination is a separate step.

## Map glue: puck, camera, route line

Everything that needs the `MapView` goes into one `DisposableMapEffect(Unit)`. Hold references outside composition so observers can reach them, and clear them in `onDispose`.

```kotlin
MapboxMap(
    style = { MapStyle(style = NavigationStyles.NAVIGATION_DAY_STYLE) }, // the screen's existing style
    onMapLongClickListener = { point -> addWaypoint(point); true },
) {
    DisposableMapEffect(Unit) { mapView ->
        mapboxMap = mapView.mapboxMap

        mapView.location.apply {
            setLocationProvider(navigationLocationProvider)
            locationPuck = LocationPuck2D(bearingImage = ImageHolder.from(R.drawable.mapbox_navigation_puck_icon))
            puckBearingEnabled = true
            enabled = true
        }

        val dataSource = MapboxNavigationViewportDataSource(mapView.mapboxMap).also { viewportDataSource = it }
        val camera = NavigationCamera(mapView.mapboxMap, mapView.camera, dataSource).also { navigationCamera = it }
        mapView.camera.addCameraAnimationsLifecycleListener(NavigationBasicGesturesHandler(camera))
        camera.registerNavigationCameraStateChangeObserver { state ->
            isFollowing.value = state == NavigationCameraState.FOLLOWING ||
                state == NavigationCameraState.TRANSITION_TO_FOLLOWING
        }

        mapView.mapboxMap.getStyle { style -> routeLineView.initializeLayers(style) }

        onDispose {
            navigationCamera = null
            viewportDataSource = null
            mapboxMap = null
        }
    }
}
```

| View system                                                                                             | Compose target                                                                                                                                               | Notes                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `binding.mapView.location.setLocationProvider(navigationLocationProvider)`                              | Same call on the `mapView` from `DisposableMapEffect`                                                                                                        | Keep `NavigationLocationProvider` outside composition. The location observer keeps calling `changePosition(...)`.                                                                 |
| `NavigationCamera(mapboxMap, mapView.camera, viewportDataSource)`                                       | Same, inside `DisposableMapEffect`                                                                                                                           | **Use `NavigationCamera` for the navigation camera.** Don't also drive the camera from `MapViewportState` transitions on this screen. No Navigation API feeds `MapViewportState`. |
| `mapView.camera.addCameraAnimationsLifecycleListener(NavigationBasicGesturesHandler(navigationCamera))` | Same                                                                                                                                                         | Keeps "the user panned, stop following"                                                                                                                                           |
| Padding from view insets (`viewportDataSource.followingPadding = ...`)                                  | Same, computed from Compose insets or fixed dp values                                                                                                        | Compare camera framing in the after screenshot                                                                                                                                    |
| `routeLineView.initializeLayers(style)` in the style-loaded callback                                    | `mapView.mapboxMap.getStyle { routeLineView.initializeLayers(it) }` in `DisposableMapEffect`                                                                 | Before the arrow layers                                                                                                                                                           |
| `mapboxMap.style?.let { routeLineView.renderRouteDrawData(it, value) }` in observers                    | Unchanged, using the `mapboxMap` reference set in the effect                                                                                                 | Null when the map isn't composed. Skip the render then.                                                                                                                           |
| `routeArrowView.renderManeuverUpdate(style, routeArrowApi.addUpcomingManeuverArrow(progress))`          | Unchanged                                                                                                                                                    |                                                                                                                                                                                   |
| Route line slot                                                                                         | Unchanged. Default `middle` (`RouteLayerConstants.DEFAULT_ROUTE_LINE_SLOT`); `MapboxRouteLineViewOptions.Builder.slotName(...)`                              | The `style` slot doesn't affect it                                                                                                                                                |
| `mapboxMap.addOnMapClickListener` for route selection                                                   | `MapboxMap(onMapClickListener = ...)`, then the existing `routeLineApi.findClosestRoute(...)` logic                                                          |                                                                                                                                                                                   |
| Map Compose `ViewAnnotation`s with route callouts                                                       | `RouteCalloutUiStateProvider` (Nav 3.16, needs `@OptIn(ExperimentalPreviewMapboxNavigationAPI::class)`), then attach callout views with the Maps Compose API | The SDK's built-in callout rendering targets the View map. `[VERIFY WITH MAPBOX]` for the version you target.                                                                     |

### Style reloads

If the screen switches styles (day and night), changing the `style` slot reloads the style. The route line and arrow layers survive it: `MapboxRouteLineView` adds persistent layers, so unchanged route data doesn't need to be drawn again. Don't add a re-render hook for the style change. If the View screen re-rendered the route after each style load, that code isn't needed in Compose. Keep rendering when the route data itself changes, as before.

## Observers → Compose state

The observer interfaces are unchanged. Write their output to state the composables read, instead of calling view methods.

| View system                                                                                          | Compose target                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RouteProgressObserver` calls `maneuverView.renderManeuvers(...)` and `tripProgressView.render(...)` | Write `maneuvers.value = ...` and `tripProgress.value = ...` (`mutableStateOf` in the state holder)                                                                                          |
| `NavigationCamera` state observer toggles the recenter button visibility                             | `isFollowing.value = ...`; the composable shows the button from state                                                                                                                        |
| `TripSessionStateObserver`, `RoutesObserver` toggle views                                            | Write state                                                                                                                                                                                  |
| Want a `Flow`                                                                                        | Wrap the observer in app code: `callbackFlow { val o = RouteProgressObserver { trySend(it) }; nav.registerRouteProgressObserver(o); awaitClose { nav.unregisterRouteProgressObserver(o) } }` |

There are no public Flow helpers for these observers in Navigation v3. Don't use anything from an `internal` package. Keep registering in `MapboxNavigationObserver.onAttached` and unregistering in `onDetached`, so a recomposition never registers twice.

## UI components

Each Navigation UI component is an Android View. Either host it in `AndroidView`, or rebuild it in Compose from the API's data. Default to hosting: it keeps the look identical. Rebuilding is a separate design decision.

```kotlin
val current = maneuvers.value
if (current.isNotEmpty()) {
    AndroidView(
        modifier = Modifier.fillMaxWidth().padding(4.dp),
        factory = { context -> MapboxManeuverView(context) },
        update = { view -> view.renderManeuvers(ExpectedFactory.createValue(current)) },
    )
}
```

| Component (`com.mapbox.navigation.ui.components.*`)                  | How to move it                                                                                                                                                                                                |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `maneuver.view.MapboxManeuverView`                                   | `AndroidView`, with `update = { it.renderManeuvers(...) }`. Keep its options in `factory`: pass `ManeuverViewOptions` to the constructor or call `updateManeuverViewOptions(...)`.                            |
| `tripprogress.view.MapboxTripProgressView`                           | `AndroidView`, with `update = { it.render(tripProgressUpdate) }`                                                                                                                                              |
| `voice.view.MapboxSoundButton`, `MapboxAudioGuidanceButton`          | `AndroidView`, or a Compose button using the SDK drawables (`R.drawable.mapbox_ic_sound_on`, `mapbox_ic_sound_off`)                                                                                           |
| `maps.camera.view.MapboxRecenterButton`, `MapboxRouteOverviewButton` | `AndroidView`, or a Compose button calling `navigationCamera?.requestNavigationCameraToFollowing()` / `requestNavigationCameraToOverview()` with `R.drawable.mapbox_ic_recenter` / `mapbox_ic_route_overview` |
| `maps.view.MapboxCameraModeButton`                                   | `AndroidView`, or a Compose button as above                                                                                                                                                                   |
| `speedlimit.view.MapboxSpeedInfoView`                                | `AndroidView`                                                                                                                                                                                                 |
| `maps.roadname.view.MapboxRoadNameView`                              | `AndroidView`                                                                                                                                                                                                 |
| `status.view.MapboxStatusView`                                       | `AndroidView`                                                                                                                                                                                                 |

Stack the map and the components in a parent `Box`, with the map first. Use `Modifier.align(...)` for placement, matching the old layout's constraints.

`AndroidView` rules:

- Create the view in `factory`, update it in `update`. Don't create a new view on every recomposition.
- Read state in the composable and pass it into `update`, so the view refreshes when state changes
- The view's XML attributes (for example `app:maneuverViewBackgroundColor` on `MapboxManeuverView`) don't come from a layout any more. Apply them in `factory` with the component's options API (for the maneuver view, `ManeuverViewOptions`), or with a themed `ContextThemeWrapper`. `[VERIFY WITH MAPBOX]` for each other component's options API.

## Behavior changes

| Change                               | View screen                               | Compose default                                                                                                                   | Preserve the View behavior                                                                                     |
| ------------------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Map recreated on leaving composition | The map lived with the Activity           | The `MapView` is destroyed when `MapboxMap` leaves composition. The puck, camera and route line are set up again when it returns. | Keep `MapboxMap` in composition for the whole navigation session. Don't put it in a branch that toggles.       |
| Camera owner                         | `NavigationCamera` only                   | `MapboxMap` also has a `MapViewportState`, which can move the camera                                                              | Leave the viewport state alone on navigation screens. Let `NavigationCamera` own the camera.                   |
| UI components rebuilt in Compose     | SDK views, with their styling             | Whatever the Compose rebuild draws                                                                                                | Host the SDK views in `AndroidView`. Only rebuild when the developer decides to.                               |
| Insets and padding                   | View layout insets fed the camera padding | Compose insets (edge-to-edge)                                                                                                     | Recompute `followingPadding` and `overviewPadding` so the puck sits in the same place. Check with screenshots. |
