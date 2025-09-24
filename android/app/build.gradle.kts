plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("dev.flutter.flutter-gradle-plugin")
}

flutter { source = "../.." }

android {
    namespace = "com.yourcompany.drillserjeant" // TODO: your real package
    compileSdk = 36

    defaultConfig {
        applicationId = "com.yourcompany.drillserjeant" // TODO: your real id
        minSdk = 23
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        configureEach { isShrinkResources = false }
        named("debug") {
            isMinifyEnabled = false
            isShrinkResources = false
        }
        named("release") {
            isMinifyEnabled = false
            isShrinkResources = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // signingConfig = signingConfigs.getByName("release")
        }
    }

    packaging {
        resources {
            excludes += setOf(
                "META-INF/AL2.0","META-INF/LGPL2.1","META-INF/licenses/**",
                "META-INF/DEPENDENCIES","META-INF/NOTICE","META-INF/NOTICE.txt",
                "META-INF/LICENSE","META-INF/LICENSE.txt"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies { implementation("org.jetbrains.kotlin:kotlin-stdlib") }
