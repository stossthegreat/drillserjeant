plugins {
    id("com.android.application")
    id("kotlin-android")
}

android {
    namespace = "com.yourcompany.drillserjeant" // <-- ensure this matches your appId package
    compileSdk = 34

    defaultConfig {
        applicationId = "com.yourcompany.drillserjeant" // <-- match your manifest/package
        minSdk = 23
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
        // If you use Kotlin DSL for testInstrumentationRunner etc., it’s the same spelling
        // testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    // If you have signing configs, keep them here; example:
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
            // Kotlin DSL uses boolean properties prefixed with 'is'
            isMinifyEnabled = false
            // isDebuggable = true // default
        }
        getByName("release") {
            // Flip this to true when you want shrinking/obfuscation
            isMinifyEnabled = false
            // Optional resource shrinking (requires isMinifyEnabled = true to have real effect)
            // isShrinkResources = true

            // R8/ProGuard rules
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )

            // If you have a release signing config, set it:
            // signingConfig = signingConfigs.getByName("release")
        }
    }

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
    // your other deps...
}
