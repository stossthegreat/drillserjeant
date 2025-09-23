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
    // TODO: set this to your real package name
    namespace = "com.yourcompany.drillserjeant"

    // Path provider (and others) now compile against 36 — match it
    compileSdk = 36

    defaultConfig {
        applicationId = "com.yourcompany.drillserjeant" // TODO: your real appId
        minSdk = 23
        targetSdk = 36

        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        // Hard-disable resource shrinking everywhere to avoid the earlier error
        configureEach {
            isShrinkResources = false
        }

        named("debug") {
            isMinifyEnabled = false
            isShrinkResources = false
        }
        named("release") {
            // Keep it simple for now; we can enable minify later with proper keep rules
            isMinifyEnabled = false
            isShrinkResources = false

            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // If you have a release keystore config, set it here:
            // signingConfig = signingConfigs.getByName("release")
        }
    }

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

    // AGP 8.x wants Java 17
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("org.jetbrains.kotlin:kotlin-stdlib")
}
