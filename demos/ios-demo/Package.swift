// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MapboxIOSDemo",
    platforms: [
        .iOS(.v14)
    ],
    products: [
        .library(
            name: "MapboxIOSDemo",
            targets: ["MapboxIOSDemo"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/mapbox/mapbox-maps-ios.git", from: "11.0.0")
    ],
    targets: [
        .target(
            name: "MapboxIOSDemo",
            dependencies: [
                .product(name: "MapboxMaps", package: "mapbox-maps-ios")
            ]
        )
    ]
)
