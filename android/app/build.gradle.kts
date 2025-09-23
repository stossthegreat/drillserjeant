plugins {
    id("com.android.application")
    id("kotlin-android")
    // Flutter’s Gradle plugin; keep this if your settings.gradle includes it
    id("dev.flutter.flutter-gradle-plugin")
}

flutter {
    // Path to the Flutter project root (relative to this file)
    source = "../.."
}

android {
    namespace = "com.yourcompany.drillserjeant" // <-- set to your package
    compileSdk = 34

    defaultConfig {
        applicationId = "com.yourcompany.drillserjeant" // <-- match your package
        minSdk = 23
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        // If you use multidex (usually not needed for Flutter unless you blow method count)
        // multiDexEnabled = true
    }

    // If you sign with env vars in CI, uncomment and set the env names below
    // signingConfigs {
    //     create("release") {
    //         storeFile = file(System.getenv("ANDROID_KEYSTORE") ?: "keystore.jks")
    //         storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
    //         keyAlias = System.getenv("ANDROID_KEY_ALIAS")
    //         keyPassword = System.getenv("ANDROID_KEY_PASSWORD")
    //     }
    // }

    buildTypes {
        getByName("debug") {
            // Kotlin DSL uses boolean props prefixed with 'is'
            isMinifyEnabled = false
            // isDebuggable = true // default
        }
        getByName("release") {
            // Start with no shrinking for simpler builds; turn on later with keep rules
            isMinifyEnabled = false
            // If you enable minify, you can also enable resource shrinking:
            // isShrinkResources = true

            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )

            // If you configured signingConfigs.release above:
            // signingConfig = signingConfigs.getByName("release")
        }
    }

    // Avoid duplicate resource merge issues
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

    // Java / Kotlin toolchains
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("org.jetbrains.kotlin:kotlin-stdlib")
    // If you need core-ktx explicitly:
    // implementation("androidx.core:core-ktx:1.13.1")
    // implementation("androidx.multidex:multidex:2.0.1") // only if you enabled multidex
}
