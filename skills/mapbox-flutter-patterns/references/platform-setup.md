# Platform Setup: iOS, Android, Tokens

Deeper reference for getting `mapbox_maps_flutter` building and running cleanly on both platforms. The SKILL.md covers the 90% path — come here for details, gotchas, and CI/release notes.

---

## iOS

### Deployment target: 14.0

Mapbox requires iOS 14.0. Flutter's default is lower, which is why a fresh `flutter create` + `flutter pub add mapbox_maps_flutter` build fails.

Set the minimum deployment on the Runner target in Xcode (General → Minimum Deployments → iOS = 14.0). If the project has an `ios/Podfile`, update the platform line to match:

```ruby
# ios/Podfile
platform :ios, '14.0'
```

After editing the Podfile, run:

```bash
cd ios && pod install && cd ..
```

If you get a Podfile.lock conflict, delete `ios/Pods/`, `ios/Podfile.lock`, and re-run `pod install`.

### CocoaPods vs Swift Package Manager

The plugin ships both: `ios/mapbox_maps_flutter.podspec` (CocoaPods) and `ios/mapbox_maps_flutter/Package.swift` (SPM). Flutter decides which to use based on your app configuration — new projects on Flutter 3.29+ default to SPM, older projects stay on CocoaPods. Either works; you don't need to choose or vendor dependencies yourself.

To force a mode machine-wide:

```bash
flutter config --enable-swift-package-manager      # SPM
flutter config --no-enable-swift-package-manager   # CocoaPods only
```

### Location permission

`ios/Runner/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Show your location on the map.</string>
```

If you ever call any "Always" authorization API, you also need `NSLocationAlwaysAndWhenInUseUsageDescription`. Without the correct key, iOS will reject the permission prompt and `CLLocationManager` will stay in `.notDetermined`.

### Background modes

The stock plugin does not require any background mode entitlement. Only enable Location updates under **Signing & Capabilities → Background Modes** if your app genuinely needs background location — each capability triggers additional App Store review scrutiny.

### Apple Silicon simulator

No extra setup needed on Flutter 3.16+. If you see `building for iOS Simulator, but linking in object file built for iOS`, clean and re-run: `flutter clean && cd ios && pod deintegrate && pod install`.

---

## Android

### minSdk and compileSdk

```kotlin
// android/app/build.gradle.kts
android {
    defaultConfig {
        minSdk = 21
        targetSdk = 34
    }
    compileSdk = 34
}
```

The Mapbox Maven repository is configured automatically by the plugin; you do not need to add it yourself.

### Permissions

`android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

Android 10+ treats location as a runtime permission — use `permission_handler` or your own flow to request it before enabling the puck.

### R8 / ProGuard

The SDK ships consumer ProGuard rules. No app-side configuration is required unless you've disabled consumer rules with `android.proguardFiles.disableConsumer`.

### Platform view modes

Android has multiple platform-view hosting modes (TLHC_VD, TLHC_HC, HC, VD). The default is fine for most apps. If you see black frames during scroll, try switching `MapWidget`'s `androidHostingMode` — this is an advanced knob, see the plugin's `MapWidget` docs.

---

## Access tokens

### Where it goes

```dart
const accessToken = String.fromEnvironment('ACCESS_TOKEN');

void main() {
  MapboxOptions.setAccessToken(accessToken);
  runApp(const MyApp());
}
```

Must run **before** any `MapWidget` is constructed — a token set later won't retroactively authenticate an already-created map.

### Passing the token at build time

```bash
flutter run --dart-define=ACCESS_TOKEN=pk.your_public_token
flutter build ios --dart-define=ACCESS_TOKEN=$MAPBOX_TOKEN
flutter build apk --dart-define=ACCESS_TOKEN=$MAPBOX_TOKEN
```

For a team of developers, a `--dart-define-from-file=env.json` file (gitignored) is convenient:

```json
// env.json
{ "ACCESS_TOKEN": "pk.your_public_token" }
```

```bash
flutter run --dart-define-from-file=env.json
```

Add `env.json` to `.gitignore`.

### VS Code / Android Studio launch configs

`.vscode/launch.json`:

```json
{
  "configurations": [
    {
      "name": "Flutter (dev)",
      "request": "launch",
      "type": "dart",
      "args": ["--dart-define-from-file=env.json"]
    }
  ]
}
```

### Public vs secret tokens

Use a **public** token (`pk.…`) in the app — it's shipped in the binary and can be extracted. Rotate and scope it with URL restrictions in the Mapbox dashboard.

Secret tokens (`sk.…`) must never ship to the client; they are for server-side tile preprocessing, offline downloads in CI, etc.

### Download token for installs

Some release workflows require a **secret download token** with the `DOWNLOADS:READ` scope. This is separate from the runtime public token and is not needed at app runtime — only by CI to fetch the native SDK binaries. If the Android build fails with "401 Unauthorized" fetching Mapbox artifacts, configure the download token in `~/.gradle/gradle.properties`:

```properties
MAPBOX_DOWNLOADS_TOKEN=sk.your_downloads_token
```

---

## CI notes

- Cache the `~/.pub-cache`, `ios/Pods`, and Gradle caches across runs — Flutter + Mapbox builds are slow from cold.
- For iOS device builds, provision profiles must include the bundle ID; nothing Mapbox-specific.
- Pass tokens via CI secrets, not committed files. Use `--dart-define=ACCESS_TOKEN=${{ secrets.MAPBOX_PUBLIC_TOKEN }}`.

---

## Release checklist

- ✅ iOS Runner Minimum Deployment = 14.0
- ✅ Android minSdk = 21
- ✅ Public token passed via `--dart-define`, not hard-coded
- ✅ Location permission purpose strings in `Info.plist`
- ✅ Location permissions declared in `AndroidManifest.xml`
- ✅ `MapboxOptions.setAccessToken(...)` called in `main()` before `runApp`
