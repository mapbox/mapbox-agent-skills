package com.example.storefinder

import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.mapbox.geojson.Point
import com.mapbox.maps.CameraOptions
import com.mapbox.maps.MapView
import com.mapbox.maps.MapboxMap
import com.mapbox.maps.RenderedQueryGeometry
import com.mapbox.maps.RenderedQueryOptions
import com.mapbox.maps.extension.style.sources.generated.GeoJsonSource
import com.mapbox.maps.extension.style.sources.getSourceAs
import com.mapbox.maps.plugin.LocationPuck2D
import com.mapbox.maps.plugin.animation.MapAnimationOptions
import com.mapbox.maps.plugin.animation.camera
import com.mapbox.maps.plugin.annotation.annotations
import com.mapbox.maps.plugin.annotation.generated.PointAnnotationManager
import com.mapbox.maps.plugin.annotation.generated.PointAnnotationOptions
import com.mapbox.maps.plugin.annotation.generated.createPointAnnotationManager
import com.mapbox.maps.plugin.delegates.listeners.OnCameraChangeListener
import com.mapbox.maps.plugin.delegates.listeners.OnMapIdleListener
import com.mapbox.maps.plugin.gestures.OnMapClickListener
import com.mapbox.maps.plugin.gestures.gestures
import com.mapbox.maps.plugin.locationcomponent.OnIndicatorPositionChangedListener
import com.mapbox.maps.plugin.locationcomponent.location

class MainActivity : AppCompatActivity() {

    private lateinit var mapView: MapView
    private lateinit var mapboxMap: MapboxMap
    private lateinit var selectedLabel: TextView
    private var favoritesManager: PointAnnotationManager? = null
    private var selectedStoreId: String? = null
    private var centeredOnUser = false

    // Analytics: the app logs how often the camera moves and when the map settles.
    private var cameraChangeCount = 0

    private val cameraChangeListener = OnCameraChangeListener {
        cameraChangeCount++
    }

    private val mapIdleListener = OnMapIdleListener {
        Analytics.log("map_idle", mapOf("camera_changes" to cameraChangeCount))
        cameraChangeCount = 0
    }

    private val positionListener = OnIndicatorPositionChangedListener { point ->
        if (!centeredOnUser) {
            centeredOnUser = true
            mapboxMap.setCamera(CameraOptions.Builder().center(point).zoom(13.0).build())
        }
    }

    private val mapClickListener = OnMapClickListener { point ->
        selectStoreAt(point)
        true
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        mapView = findViewById(R.id.mapView)
        selectedLabel = findViewById(R.id.selectedStore)
        mapboxMap = mapView.getMapboxMap()

        mapboxMap.loadStyleUri(STYLE_URL) { style ->
            style.addStoreLayers()
            addFavoriteAnnotations()
            enableLocation()
        }

        mapView.gestures.addOnMapClickListener(mapClickListener)
        mapboxMap.addOnCameraChangeListener(cameraChangeListener)
        mapboxMap.addOnMapIdleListener(mapIdleListener)
    }

    /** Finds the store under the tap and highlights it by rebuilding the source. */
    private fun selectStoreAt(point: Point) {
        val screenPoint = mapboxMap.pixelForCoordinate(point)
        mapboxMap.queryRenderedFeatures(
            RenderedQueryGeometry(screenPoint),
            RenderedQueryOptions(listOf(STORE_LAYER_ID), null)
        ) { result ->
            val feature = result.value?.firstOrNull()?.feature ?: return@queryRenderedFeatures
            val storeId = feature.getStringProperty("id") ?: return@queryRenderedFeatures
            selectStore(storeId)
        }
    }

    private fun selectStore(storeId: String) {
        val store = StoreRepository.byId(storeId) ?: return
        selectedStoreId = storeId
        mapboxMap.getStyle { style ->
            style.getSourceAs<GeoJsonSource>(STORE_SOURCE_ID)
                ?.featureCollection(StoreRepository.featureCollection(selectedStoreId))
        }
        selectedLabel.text = store.name
        mapView.camera.flyTo(
            CameraOptions.Builder().center(store.location).zoom(15.0).build(),
            MapAnimationOptions.mapAnimationOptions { duration(800) }
        )
        Analytics.log("store_selected", mapOf("store_id" to storeId))
    }

    private fun addFavoriteAnnotations() {
        val icon = bitmapFromDrawable(R.drawable.ic_store) ?: return
        val manager = mapView.annotations.createPointAnnotationManager()
        manager.create(
            StoreRepository.stores.filter { it.favorite }.map { store ->
                PointAnnotationOptions()
                    .withPoint(store.location)
                    .withIconImage(icon)
                    .withIconSize(1.5)
                    .withData(com.google.gson.JsonPrimitive(store.id))
            }
        )
        manager.addClickListener { annotation ->
            annotation.getData()?.asString?.let { selectStore(it) }
            true
        }
        favoritesManager = manager
    }

    private fun enableLocation() {
        mapView.location.updateSettings {
            enabled = true
            pulsingEnabled = true
            locationPuck = LocationPuck2D(
                bearingImage = ContextCompat.getDrawable(this@MainActivity, R.drawable.ic_store)
            )
        }
        mapView.location.addOnIndicatorPositionChangedListener(positionListener)
    }

    private fun bitmapFromDrawable(resId: Int): Bitmap? {
        val drawable = ContextCompat.getDrawable(this, resId) ?: return null
        val bitmap = Bitmap.createBitmap(
            drawable.intrinsicWidth * 2,
            drawable.intrinsicHeight * 2,
            Bitmap.Config.ARGB_8888
        )
        val canvas = Canvas(bitmap)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        return bitmap
    }

    override fun onDestroy() {
        super.onDestroy()
        mapView.gestures.removeOnMapClickListener(mapClickListener)
        mapboxMap.removeOnCameraChangeListener(cameraChangeListener)
        mapboxMap.removeOnMapIdleListener(mapIdleListener)
        mapView.location.removeOnIndicatorPositionChangedListener(positionListener)
        favoritesManager?.let { mapView.annotations.removeAnnotationManager(it) }
    }

    companion object {
        // The app's own style. A migration must keep it.
        const val STYLE_URL = "mapbox://styles/example-org/clstorefinder01"
    }
}
