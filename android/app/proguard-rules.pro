# Baseline rules (only used when you later enable minify)
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

-keepattributes *Annotation*
-keep @androidx.annotation.Keep class * { *; }
-keepclassmembers class * { @androidx.annotation.Keep *; }

-dontwarn kotlin.**
-dontwarn org.jetbrains.**
