package com.example.storefinder

import com.mapbox.maps.Style
import com.mapbox.maps.extension.style.expressions.generated.Expression.Companion.literal
import com.mapbox.maps.extension.style.expressions.generated.Expression.Companion.switchCase
import com.mapbox.maps.extension.style.expressions.generated.Expression.Companion.get
import com.mapbox.maps.extension.style.layers.addLayer
import com.mapbox.maps.extension.style.layers.generated.circleLayer
import com.mapbox.maps.extension.style.sources.addSource
import com.mapbox.maps.extension.style.sources.generated.geoJsonSource

const val STORE_SOURCE_ID = "stores"
const val STORE_LAYER_ID = "stores-circle"

fun Style.addStoreLayers() {
    addSource(
        geoJsonSource(STORE_SOURCE_ID) {
            featureCollection(StoreRepository.featureCollection(selectedId = null))
        }
    )
    addLayer(
        circleLayer(STORE_LAYER_ID, STORE_SOURCE_ID) {
            circleRadius(
                switchCase {
                    get("selected")
                    literal(12.0)
                    literal(8.0)
                }
            )
            circleColor(
                switchCase {
                    get("selected")
                    literal("#E91E63")
                    literal("#757575")
                }
            )
            circleStrokeWidth(2.0)
            circleStrokeColor("#FFFFFF")
        }
    )
}
