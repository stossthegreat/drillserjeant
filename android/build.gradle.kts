// File: android/build.gradle.kts

// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.25" apply false
    id("dev.flutter.flutter-gradle-plugin") version "1.0.0" apply false
}

buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        // The Flutter Gradle plugin handles most of this.
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
