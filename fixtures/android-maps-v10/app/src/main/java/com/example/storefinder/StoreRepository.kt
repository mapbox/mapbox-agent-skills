package com.example.storefinder

import com.mapbox.geojson.Feature
import com.mapbox.geojson.FeatureCollection
import com.mapbox.geojson.Point

data class Store(val id: String, val name: String, val location: Point, val favorite: Boolean)

object StoreRepository {
    val stores = listOf(
        Store("s1", "Market Street", Point.fromLngLat(-122.4089, 37.7837), favorite = true),
        Store("s2", "Mission", Point.fromLngLat(-122.4194, 37.7599), favorite = false),
        Store("s3", "Marina", Point.fromLngLat(-122.4364, 37.8030), favorite = false),
        Store("s4", "Sunset", Point.fromLngLat(-122.4945, 37.7531), favorite = true),
        Store("s5", "Dogpatch", Point.fromLngLat(-122.3880, 37.7576), favorite = false)
    )

    fun byId(id: String): Store? = stores.firstOrNull { it.id == id }

    /** Builds the store collection, marking [selectedId] so the layer can highlight it. */
    fun featureCollection(selectedId: String?): FeatureCollection =
        FeatureCollection.fromFeatures(
            stores.map { store ->
                Feature.fromGeometry(store.location).apply {
                    addStringProperty("id", store.id)
                    addStringProperty("name", store.name)
                    addBooleanProperty("selected", store.id == selectedId)
                }
            }
        )
}
