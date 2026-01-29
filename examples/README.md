# Mapbox Agent Skills Examples

This directory contains both **conversation examples** and **working code examples** demonstrating how the Mapbox Agent Skills work in practice.

## 📝 Conversation Examples

Realistic conversation transcripts showing how AI assistants use the skills to help with common tasks.

- [Web Performance Optimization](./conversations/web-performance-optimization.md) - Optimizing a slow map with 5,000 markers
- [iOS SwiftUI Setup](./conversations/ios-swiftui-setup.md) - Setting up Mapbox in a SwiftUI app
- [Android Jetpack Compose Setup](./conversations/android-compose-setup.md) - Integrating Mapbox with Jetpack Compose
- [Restaurant Finder Design](./conversations/restaurant-finder-design.md) - Designing a map style for a restaurant finder

## 💻 Working Code Examples

Complete, runnable applications that follow the patterns from the skills.

### Web Examples

- [react-map-basic](./web/react-map-basic/) - Basic React map with proper lifecycle management
- [vue-map-with-markers](./web/vue-map-with-markers/) - Vue map with optimized marker clustering
- [performance-optimized](./web/performance-optimized/) - Advanced performance patterns (parallel loading, clustering)

### iOS Examples

- [SwiftUIMapExample](./ios/SwiftUIMapExample/) - SwiftUI map with UIViewRepresentable pattern
- [UIKitMapExample](./ios/UIKitMapExample/) - UIKit map with proper lifecycle and memory management

### Android Examples

- [ComposeMapExample](./android/ComposeMapExample/) - Jetpack Compose map with AndroidView pattern
- [ViewSystemMapExample](./android/ViewSystemMapExample/) - Traditional Android View system integration

## How to Use These Examples

### Conversation Examples

Read through the conversation transcripts to see:
- What skills get activated for different tasks
- How skills inform better decision-making
- The quality of guidance provided by skill-enhanced AI assistants

### Code Examples

Each code example includes:
- Complete, working code following skill patterns
- README explaining what patterns are demonstrated
- Comments highlighting key practices from the skills
- Instructions for running the example

**Prerequisites:**
- Web: Node.js 18+, Mapbox access token
- iOS: Xcode 15+, Mapbox access token
- Android: Android Studio, Mapbox access token

See individual example READMEs for specific setup instructions.

## Testing the Skills

Want to test if an AI assistant is using the skills correctly? Try these prompts:

**Web Performance:**
```
"I have a Mapbox map with 50,000 restaurant markers and it's really slow.
How do I optimize it?"
```

**iOS Integration:**
```
"I need to add a Mapbox map to my SwiftUI app.
Show me the correct pattern with proper cleanup."
```

**Android Integration:**
```
"How do I integrate Mapbox Maps SDK into my Jetpack Compose app
with proper lifecycle handling?"
```

**Map Design:**
```
"I'm building a real estate app. What map style should I use
and what colors work best for property markers?"
```

Compare the AI's response with the guidance in the skills to verify it's being applied correctly.

## Contributing Examples

Have a great example that demonstrates skill usage? We'd love to include it!

**For conversation examples:**
1. Use the skill with an AI assistant
2. Copy the conversation transcript
3. Annotate which skills were used
4. Submit a PR

**For code examples:**
1. Create a minimal, focused example
2. Follow patterns from the relevant skill
3. Add comments explaining key decisions
4. Include a README with setup instructions
5. Test thoroughly
6. Submit a PR

See [CONTRIBUTING.md](../CONTRIBUTING.md) for more details.
