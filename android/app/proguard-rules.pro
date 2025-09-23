# Keep Flutter and Dart entry points safe when enabling minify/shrink later
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugins.** { *; }
-keep class io.flutter.embedding.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }

# Keep classes with @Keep
-keepattributes *Annotation*
-keep @androidx.annotation.Keep class * { *; }
-keepclassmembers class * {
    @androidx.annotation.Keep *;
}

# Don’t warn about missing meta for Kotlin/Jetbrains
-dontwarn kotlin.**
-dontwarn org.jetbrains.**
