pluginManagement {
    val flutterSdkPath: String? = run {
        // 1) Prefer -Pflutter.sdk passed by Flutter
        val prop = providers.gradleProperty("flutter.sdk").orNull
        if (prop != null && java.io.File(prop).exists()) return@run prop

        // 2) Try common environment variables
        val envHome = System.getenv("FLUTTER_HOME")
        if (envHome != null && java.io.File(envHome).exists()) return@run envHome
        val envRoot = System.getenv("FLUTTER_ROOT")
        if (envRoot != null && java.io.File(envRoot).exists()) return@run envRoot

        // 3) Fallback to android/local.properties if present
        val properties = java.util.Properties()
        val lp = file("local.properties")
        if (lp.exists()) {
            lp.inputStream().use { properties.load(it) }
            val lpPath = properties.getProperty("flutter.sdk")
            if (lpPath != null && java.io.File(lpPath).exists()) return@run lpPath
        }

        null
    }

    require(flutterSdkPath != null) { "flutter.sdk not set and FLUTTER_HOME/FLUTTER_ROOT not found. Ensure Flutter is installed in CI or pass -Pflutter.sdk." }

    includeBuild("$flutterSdkPath/packages/flutter_tools/gradle")

    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

plugins {
    id("dev.flutter.flutter-plugin-loader") version "1.0.0"
    id("com.android.application") version "8.7.3" apply false
    id("org.jetbrains.kotlin.android") version "2.1.0" apply false
}

include(":app")
