plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("dev.flutter.flutter-gradle-plugin")
}

flutter {
    // Path to your Flutter project root
    source = "../.."
}

android {
    namespace = "com.yourcompany.drillserjeant" // <-- set to your actual package
    compileSdk = 34

    defaultConfig {
        applicationId = "com.yourcompany.drillserjeant" // <-- match your actual package
        minSdk = 23
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        getByName("debug") {
            // Use Kotlin DSL boolean props with 'is' prefix
            isMinifyEnabled = false
            // Ensure no resource shrinking is enabled in debug
            // (sometimes templates toggle this; be explicit)
            // isShrinkResources = false
        }
        getByName("release") {
            // Build now: no code shrinking, no resource shrinking
            isMinifyEnabled = false
            // IMPORTANT: resource shrinking requires minify to be true.
            // Leave this OFF for now to avoid the error you saw.
            // Turn ON later only if you also set isMinifyEnabled = true.
            // See: https://developer.android.com/studio/build/shrink-code
            // and https://developer.android.com/studio/build/shrink-code#shrink-resources
            // Kotlin DSL property:
            // isShrinkResources = true  <-- DO NOT enable unless minify is also true

            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )

            // If you have signing configs, uncomment and use them:
            // signingConfig = signingConfigs.getByName("release")
        }
    }

    // Avoid duplicate META-INF merges
    packaging {
        resources {
            excludes += setOf(
                "META-INF/AL2.0",
                "META-INF/LGPL2.1",
                "META-INF/licenses/**",
                "META-INF/DEPENDENCIES",
                "META-INF/NOTICE",
                "META-INF/NOTICE.txt",
                "META-INF/LICENSE",
                "META-INF/LICENSE.txt"
            )
        }
    }

    // JDK 17 toolchains for AGP 8.x
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("org.jetbrains.kotlin:kotlin-stdlib")
}
