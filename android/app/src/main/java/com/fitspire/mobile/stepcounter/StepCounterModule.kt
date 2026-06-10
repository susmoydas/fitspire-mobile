package com.fitspire.mobile.stepcounter

import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = StepCounterModule.NAME)
class StepCounterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = NAME

    companion object {
        const val NAME = "StepCounter"
    }

    @ReactMethod
    fun startForegroundService(promise: Promise) {
        try {
            val context = reactApplicationContext
            val intent = Intent(context, StepCounterForegroundService::class.java)
            intent.action = StepCounterForegroundService.ACTION_START

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopForegroundService(promise: Promise) {
        try {
            val context = reactApplicationContext
            val intent = Intent(context, StepCounterForegroundService::class.java)
            intent.action = StepCounterForegroundService.ACTION_STOP
            context.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getStepCount(promise: Promise) {
        try {
            val count = StepCounterForegroundService.getStepCount(reactApplicationContext)
            promise.resolve(count)
        } catch (e: Exception) {
            promise.reject("GET_COUNT_ERROR", e.message)
        }
    }

    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        // Check if service is running by checking if we have a recent step count
        // This is a simple check; a more robust implementation would use ActivityManager
        try {
            val context = reactApplicationContext
            val prefs = context.getSharedPreferences(StepCounterForegroundService.PREFS_NAME, Context.MODE_PRIVATE)
            val startTime = prefs.getLong(StepCounterForegroundService.KEY_START_TIME, 0)
            val now = System.currentTimeMillis()
            val isRunning = (now - startTime) < 86400000 // 24 hours
            promise.resolve(isRunning)
        } catch (e: Exception) {
            promise.reject("IS_RUNNING_ERROR", e.message)
        }
    }
}