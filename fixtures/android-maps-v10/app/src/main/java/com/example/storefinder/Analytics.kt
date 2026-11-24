package com.example.storefinder

import android.util.Log

/** Stand-in for the app's analytics client. */
object Analytics {
    fun log(event: String, params: Map<String, Any?> = emptyMap()) {
        Log.d("Analytics", "$event $params")
    }
}
