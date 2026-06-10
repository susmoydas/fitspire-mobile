package com.fitspire.mobile.stepcounter

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import com.fitspire.mobile.R

class StepCounterForegroundService : Service(), SensorEventListener {

    private var sensorManager: SensorManager? = null
    private var stepCounterSensor: Sensor? = null
    private var notificationManager: NotificationManager? = null
    private var prefs: SharedPreferences? = null
    private var wakeLock: android.os.PowerManager.WakeLock? = null
    private var bootBaseline: Int = 0
    private var baselineRecorded: Boolean = false

    companion object {
        const val CHANNEL_ID = "StepCounterChannel"
        const val NOTIFICATION_ID = 1001
        const val PREFS_NAME = "StepCounterPrefs"
        const val KEY_STEP_COUNT = "step_count"
        const val KEY_START_TIME = "start_time"
        const val KEY_BOOT_BASELINE = "boot_baseline"
        const val KEY_BASELINE_RECORDED = "baseline_recorded"
        const val ACTION_START = "com.fitspire.mobile.STEP_COUNTER_START"
        const val ACTION_STOP = "com.fitspire.mobile.STEP_COUNTER_STOP"
        const val ACTION_GET_COUNT = "com.fitspire.mobile.STEP_COUNTER_GET_COUNT"

        fun getStepCount(context: Context): Int {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            return prefs.getInt(KEY_STEP_COUNT, 0)
        }

        fun getBootBaseline(context: Context): Int {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            return prefs.getInt(KEY_BOOT_BASELINE, 0)
        }
    }

    override fun onCreate() {
        super.onCreate()
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        stepCounterSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        createNotificationChannel()
        acquireWakeLock()
        loadBaseline()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Step Counter Service",
                NotificationManager.IMPORTANCE_LOW
            )
            channel.description = "Tracks steps in the background"
            channel.enableVibration(false)
            channel.setSound(null, null)
            notificationManager?.createNotificationChannel(channel)
        }
    }

    private fun acquireWakeLock() {
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "StepCounterWakeLock")
        wakeLock?.acquire()
    }

    private fun releaseWakeLock() {
        wakeLock?.release()
        wakeLock = null
    }

    private fun loadBaseline() {
        prefs?.let {
            bootBaseline = it.getInt(KEY_BOOT_BASELINE, 0)
            baselineRecorded = it.getBoolean(KEY_BASELINE_RECORDED, false)
        }
    }

    private fun saveBaseline() {
        prefs?.edit()?.apply {
            putInt(KEY_BOOT_BASELINE, bootBaseline)
            putBoolean(KEY_BASELINE_RECORDED, baselineRecorded)
            apply()
        }
    }

    private fun startStepCounting() {
        if (stepCounterSensor != null) {
            sensorManager?.registerListener(this, stepCounterSensor, SensorManager.SENSOR_DELAY_NORMAL)
        }
    }

    private fun stopStepCounting() {
        sensorManager?.unregisterListener(this)
    }

    private fun getCurrentStepCount(): Int {
        return prefs?.getInt(KEY_STEP_COUNT, 0) ?: 0
    }

    private fun saveStepCount(count: Int) {
        prefs?.edit()?.putInt(KEY_STEP_COUNT, count)?.apply()
    }

    private fun getStartTime(): Long {
        return prefs?.getLong(KEY_START_TIME, System.currentTimeMillis()) ?: System.currentTimeMillis()
    }

    private fun saveStartTime(time: Long) {
        prefs?.edit()?.putLong(KEY_START_TIME, time)?.apply()
    }

    private fun resetDailyCountIfNeeded() {
        val startTime = getStartTime()
        val now = System.currentTimeMillis()
        val startOfDay = getStartOfDay(now)
        val startOfDayStartTime = getStartOfDay(startTime)

        if (startOfDayStartTime < startOfDay) {
            saveStepCount(0)
            saveStartTime(now)
            // Reset baseline so the next sensor event captures the current
            // cumulative sensor value as the new day's starting point.
            bootBaseline = 0
            baselineRecorded = false
            saveBaseline()
        }
    }

    private fun getStartOfDay(timestamp: Long): Long {
        val calendar = java.util.Calendar.getInstance()
        calendar.timeInMillis = timestamp
        calendar.set(java.util.Calendar.HOUR_OF_DAY, 0)
        calendar.set(java.util.Calendar.MINUTE, 0)
        calendar.set(java.util.Calendar.SECOND, 0)
        calendar.set(java.util.Calendar.MILLISECOND, 0)
        return calendar.timeInMillis
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action

        when (action) {
            ACTION_START -> {
                resetDailyCountIfNeeded()
                startStepCounting()
                val notification = createNotification()
                startForeground(NOTIFICATION_ID, notification)
            }
            ACTION_STOP -> {
                stopStepCounting()
                stopForeground(true)
                stopSelf()
                return START_NOT_STICKY
            }
        }

        return START_STICKY
    }

    private fun createNotification(): Notification {
        val intent = Intent(this, com.fitspire.mobile.MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val currentSteps = getCurrentStepCount()

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("FitSpire Step Counter")
            .setContentText("Tracking steps: $currentSteps steps today")
            .setSmallIcon(R.drawable.notification_icon)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotification(steps: Int) {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("FitSpire Step Counter")
            .setContentText("Tracking steps: $steps steps today")
            .setSmallIcon(R.drawable.notification_icon)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        notificationManager?.notify(NOTIFICATION_ID, notification)
    }

    override fun onSensorChanged(event: SensorEvent?) {
        event?.let {
            if (it.sensor.type == Sensor.TYPE_STEP_COUNTER) {
                resetDailyCountIfNeeded()
                val rawSteps = it.values[0].toInt()
                if (!baselineRecorded) {
                    bootBaseline = rawSteps
                    baselineRecorded = true
                    saveBaseline()
                }
                val dailySteps = rawSteps - bootBaseline
                if (dailySteps >= 0) {
                    saveStepCount(dailySteps)
                    updateNotification(dailySteps)
                }
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    override fun onDestroy() {
        stopStepCounting()
        releaseWakeLock()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}