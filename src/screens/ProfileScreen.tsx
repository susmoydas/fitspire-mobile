import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';
import FitnessConnectorCard from '../components/FitnessConnectorCard';
import PermissionStatusPill from '../components/PermissionStatusPill';
import { useHealthIntegration } from '../hooks/useHealthIntegration';
import {
  refreshPermissionStatuses,
  requestAllPermissions,
  openAppSettings,
  type PermissionStatuses,
  type PermissionLevel,
} from '../services/permissions';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const GOAL_LABELS: Record<string, string> = {
  fat_loss: 'Fat Loss',
  muscle_gain: 'Muscle Gain',
  general_fitness: 'General Fitness',
  improve_stamina: 'Improve Stamina',
  stay_active: 'Stay Active',
  improve_flexibility: 'Flexibility',
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const profile = useStore((s) => s.profile);
  const clearProfile = useStore((s) => s.clearProfile);
  const { connectors, checkingId, handleConnect, handleDisconnect } = useHealthIntegration();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="person" size={32} color="#fff" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile.gender === 'male' ? 'Ready to train' : profile.gender === 'female' ? 'Ready to train' : 'Fitness Champion'}
              </Text>
              {profile.fitnessGoal && (
                <Text style={styles.profileGoal}>{GOAL_LABELS[profile.fitnessGoal] || profile.fitnessGoal}</Text>
              )}
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('EditProfile')}
                activeOpacity={0.85}
              >
                <MaterialIcons name="edit" size={14} color={colors.primary} />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          {[
            { label: 'Age', value: profile.age ? `${profile.age}` : '--' },
            { label: 'Height', value: profile.height ? `${profile.height} cm` : '--' },
            { label: 'Weight', value: profile.weight ? `${profile.weight} kg` : '--' },
            { label: 'Level', value: profile.experience ? profile.experience.charAt(0).toUpperCase() + profile.experience.slice(1) : '--' },
          ].map((s) => (
            <View key={s.label} style={styles.quickStatBox}>
              <Text style={styles.quickStatValue}>{s.value}</Text>
              <Text style={styles.quickStatLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Daily Goals */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Daily Goals</Text>
          <View style={styles.goalRow}>
            <MaterialIcons name="directions-walk" size={20} color={colors.primary} />
            <Text style={styles.goalLabel}>Daily Steps</Text>
            <Text style={styles.goalValue}>{profile.stepGoal?.toLocaleString() || '10,000'}</Text>
          </View>
          <View style={styles.goalRow}>
            <MaterialIcons name="timer" size={20} color={colors.primary} />
            <Text style={styles.goalLabel}>Workout Duration</Text>
            <Text style={styles.goalValue}>{profile.preferredWorkoutDuration || 30} min</Text>
          </View>
          <View style={styles.goalRow}>
            <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
            <Text style={styles.goalLabel}>Workout Days</Text>
            <Text style={styles.goalValue}>{profile.workoutDaysPerWeek || 5} / week</Text>
          </View>
        </View>

        {/* Tracking & Permissions */}
        <TrackingPermissionsSection />

        {/* Connected Devices */}
        <View style={styles.sectionCard}>
          {connectors.map((item) => (
            <FitnessConnectorCard
              key={item.id}
              item={item}
              checking={checkingId === item.id}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          ))}
        </View>

        {/* Settings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.settingRow}>
            <MaterialIcons name="notifications" size={20} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Reminders</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow}>
            <MaterialIcons name="straighten" size={20} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Units</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow}>
            <MaterialIcons name="info" size={20} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>About</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Reset */}
        <TouchableOpacity style={styles.resetBtn} onPress={clearProfile}>
          <MaterialIcons name="delete-forever" size={20} color={colors.error} />
          <Text style={styles.resetText}>Reset All Data</Text>
        </TouchableOpacity>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

function TrackingPermissionsSection() {
  const stepTrackingEnabled = useStore((s) => s.stepTrackingEnabled);
  const setStepTrackingEnabled = useStore((s) => s.setStepTrackingEnabled);
  const locationTrackingEnabled = useStore((s) => s.locationTrackingEnabled);
  const setLocationTrackingEnabled = useStore((s) => s.setLocationTrackingEnabled);
  const backgroundNotificationEnabled = useStore((s) => s.backgroundNotificationEnabled);
  const setBackgroundNotificationEnabled = useStore(
    (s) => s.setBackgroundNotificationEnabled,
  );

  const [statuses, setStatuses] = useState<PermissionStatuses>({
    activityRecognition: 'undetermined',
    location: 'undetermined',
    notification: 'undetermined',
  });
  const [busy, setBusy] = useState<'step' | 'location' | 'notif' | null>(null);

  const refresh = useCallback(async () => {
    const s = await refreshPermissionStatuses();
    setStatuses(s);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleStepToggle = async (next: boolean) => {
    if (busy) return;
    if (!next) {
      setStepTrackingEnabled(false);
      return;
    }
    setBusy('step');
    try {
      const result = await requestAllPermissions({ askLocation: false, askNotification: true });
      setStatuses(result);
      if (result.activityRecognition === 'denied' || result.activityRecognition === 'unavailable') {
        Alert.alert(
          'Permission required',
          'Step tracking needs the Physical Activity permission. Open Settings to allow it.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => openAppSettings() },
          ],
        );
        setStepTrackingEnabled(false);
        return;
      }
      setStepTrackingEnabled(true);
      if (result.notification !== 'granted') {
        setBackgroundNotificationEnabled(false);
      } else {
        setBackgroundNotificationEnabled(true);
      }
    } finally {
      setBusy(null);
    }
  };

  const handleLocationToggle = async (next: boolean) => {
    if (busy) return;
    if (!next) {
      setLocationTrackingEnabled(false);
      return;
    }
    setBusy('location');
    try {
      const result = await requestAllPermissions({ askLocation: true, askNotification: false });
      setStatuses(result);
      if (result.location === 'denied') {
        Alert.alert(
          'Permission required',
          'Location Access needs the Location permission. Open Settings to allow it.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => openAppSettings() },
          ],
        );
        setLocationTrackingEnabled(false);
        return;
      }
      setLocationTrackingEnabled(true);
    } finally {
      setBusy(null);
    }
  };

  const handleNotifToggle = async (next: boolean) => {
    if (busy) return;
    setBusy('notif');
    try {
      if (!next) {
        setBackgroundNotificationEnabled(false);
        return;
      }
      const result = await requestAllPermissions({ askLocation: false, askNotification: true });
      setStatuses(result);
      if (result.notification === 'granted') {
        setBackgroundNotificationEnabled(true);
      } else {
        setBackgroundNotificationEnabled(false);
        Alert.alert(
          'Notification permission',
          'Notifications are blocked. Open Settings to allow them.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => openAppSettings() },
          ],
        );
      }
    } finally {
      setBusy(null);
    }
  };

  const stepStatus: PermissionLevel =
    !stepTrackingEnabled
      ? 'denied'
      : statuses.activityRecognition;
  const notifStatus: PermissionLevel =
    !backgroundNotificationEnabled
      ? 'denied'
      : statuses.notification;
  const locationStatus: PermissionLevel =
    !locationTrackingEnabled
      ? 'denied'
      : statuses.location;

  return (
    <View style={styles.sectionCard}>
      <View style={styles.trackingHeader}>
        <TouchableOpacity onPress={refresh} style={styles.recheckBtn} activeOpacity={0.7}>
          <MaterialIcons name="refresh" size={18} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Tracking & Permissions</Text>
      </View>

      <View style={styles.trackingRow}>
        <View style={styles.trackingIcon}>
          <MaterialIcons name="directions-walk" size={20} color={colors.primary} />
        </View>
        <View style={styles.trackingInfo}>
          <Text style={styles.trackingLabel}>Step Tracking</Text>
          <View style={styles.trackingPill}>
            <PermissionStatusPill status={stepStatus} />
          </View>
        </View>
        <Switch
          value={stepTrackingEnabled}
          onValueChange={handleStepToggle}
          disabled={busy !== null}
          trackColor={{ false: '#3A3A3C', true: colors.primary + '80' }}
          thumbColor={stepTrackingEnabled ? colors.primary : '#8E8E93'}
        />
      </View>

      <View style={styles.trackingRow}>
        <View style={styles.trackingIcon}>
          <MaterialIcons name="place" size={20} color={colors.info} />
        </View>
        <View style={styles.trackingInfo}>
          <Text style={styles.trackingLabel}>Location Access</Text>
          <Text style={styles.trackingHint}>
            {Platform.OS === 'ios' ? 'iOS will ask again' : 'Used only during a workout'}
          </Text>
          <View style={styles.trackingPill}>
            <PermissionStatusPill status={locationStatus} />
          </View>
        </View>
        <Switch
          value={locationTrackingEnabled}
          onValueChange={handleLocationToggle}
          disabled={busy !== null}
          trackColor={{ false: '#3A3A3C', true: colors.info + '80' }}
          thumbColor={locationTrackingEnabled ? colors.info : '#8E8E93'}
        />
      </View>

      <View style={[styles.trackingRow, styles.trackingRowLast]}>
        <View style={styles.trackingIcon}>
          <MaterialIcons name="notifications-active" size={20} color={colors.success} />
        </View>
        <View style={styles.trackingInfo}>
          <Text style={styles.trackingLabel}>Background Notification</Text>
          <Text style={styles.trackingHint}>Step tracker notification on Home</Text>
          <View style={styles.trackingPill}>
            <PermissionStatusPill status={notifStatus} />
          </View>
        </View>
        <Switch
          value={backgroundNotificationEnabled}
          onValueChange={handleNotifToggle}
          disabled={busy !== null}
          trackColor={{ false: '#3A3A3C', true: colors.success + '80' }}
          thumbColor={backgroundNotificationEnabled ? colors.success : '#8E8E93'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm + 4,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    color: colors.text,
    fontSize: fontSize.hero,
    fontWeight: '700',
  },
  profileGoal: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickStatBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickStatValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  quickStatLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
    fontWeight: '500',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.cardElevated,
    paddingHorizontal: spacing.md + 4,
    height: 40,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  editBtnText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  goalLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    flex: 1,
  },
  goalValue: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  settingLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    flex: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 56,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error + '40',
    backgroundColor: colors.cardElevated,
  },
  resetText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: '600',
  },

  // Tracking & Permissions
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  recheckBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  trackingRowLast: {
    borderBottomWidth: 0,
  },
  trackingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingInfo: {
    flex: 1,
    gap: 4,
  },
  trackingLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  trackingHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  trackingPill: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
});
