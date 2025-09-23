plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("dev.flutter.flutter-gradle-plugin")
}

flutter {
    source = "../.."
}

android {
    namespace = "com.yourcompany.drillserjeant" // set to your actual package
    compileSdk = 34

    defaultConfig {
        applicationId = "com.yourcompany.drillserjeant" // set to your actual package
        minSdk = 23
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        // Force OFF resource shrinking everywhere to stop the hard fail
        configureEach {
            isShrinkResources = false
        }

        // Debug
        named("debug") {
            isMinifyEnabled = false
            isShrinkResources = false
        }

        // Release
        named("release") {
            // keep simple for now; we can enable minify later with proper keep rules
            isMinifyEnabled = false
            isShrinkResources = false

            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )

            // signingConfig = signingConfigs.getByName("release") // if you use one
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

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("org.jetbrains.kotlin:kotlin-stdlib")
}
