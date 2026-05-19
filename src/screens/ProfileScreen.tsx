import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import Card from '../components/Card';
import Button from '../components/Button';
import BottomSheet from '../components/BottomSheet';
import { colors, fontSize, spacing, borderRadius } from '../components/Theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const profile = useStore((s) => s.profile);
  const clearProfile = useStore((s) => s.clearProfile);

  const [showBottomSheet, setShowBottomSheet] = useState<string | null>(null);

  const handleReset = () => {
    clearProfile();
  };

  const infoRows = [
    { label: 'Gender', value: profile.gender || 'Not set' },
    { label: 'Age', value: profile.age ? `${profile.age} years` : 'Not set' },
    { label: 'Height', value: profile.height ? `${profile.height} cm` : 'Not set' },
    { label: 'Weight', value: profile.weight ? `${profile.weight} kg` : 'Not set' },
    { label: 'Goal Weight', value: profile.goalWeight ? `${profile.goalWeight} kg` : 'Not set' },
    { label: 'Experience', value: profile.experience || 'Not set' },
    { label: 'Max Reps', value: profile.maxReps ? `${profile.maxReps}` : 'Not set' },
    { label: 'Session Duration', value: profile.sessionDuration ? `${profile.sessionDuration} min` : 'Not set' },
    { label: 'Training Days', value: profile.trainingDays?.length ? `${profile.trainingDays.length} days/week` : 'Not set' },
    { label: 'Pace', value: profile.pace || 'Not set' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>Profile</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar / Greeting */}
        <Card style={styles.profileCard}>
          <Text style={styles.avatar}>
            {profile.gender === 'male' ? '💪' : profile.gender === 'female' ? '💃' : '🏋️'}
          </Text>
          <Text style={styles.profileName}>
            {profile.gender === 'male' ? 'Fitness Bro' : profile.gender === 'female' ? 'Fitness Girl' : 'Fitness Champ'}
          </Text>
          {profile.weight && profile.goalWeight && (
            <Text style={styles.profileGoal}>
              Goal: {profile.weight}kg → {profile.goalWeight}kg
            </Text>
          )}
        </Card>

        {/* User Info */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Personal Info</Text>
          {infoRows.map((row) => (
            <View key={row.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </Card>

        {/* Settings */}
        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity style={styles.settingRow} onPress={() => setShowBottomSheet('privacy')}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Text style={styles.settingArrow}>{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => setShowBottomSheet('terms')}>
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <Text style={styles.settingArrow}>{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => setShowBottomSheet('about')}>
            <Text style={styles.settingLabel}>About Fitspire</Text>
            <Text style={styles.settingArrow}>{'>'}</Text>
          </TouchableOpacity>
        </Card>

        {/* Reset */}
        <Button
          title="Reset All Data"
          onPress={handleReset}
          variant="outline"
          fullWidth
          style={{ borderColor: colors.error }}
          textStyle={{ color: colors.error }}
        />
      </ScrollView>

      {/* Bottom Sheets */}
      <BottomSheet visible={showBottomSheet === 'privacy'} onClose={() => setShowBottomSheet(null)} title="Privacy Policy">
        <Text style={styles.bodyText}>
          Fitspire respects your privacy. All your data is stored locally on your device using AsyncStorage.
          {'\n\n'}We do not collect, share, or transmit any personal information to third parties.
          {'\n\n'}Your fitness data, including workouts, meals, and activity metrics, remains solely on your device.
          {'\n\n'}If you choose to enable optional API features (exercise images, food search), your queries are sent
          only to those specific services.
        </Text>
      </BottomSheet>

      <BottomSheet visible={showBottomSheet === 'terms'} onClose={() => setShowBottomSheet(null)} title="Terms of Service">
        <Text style={styles.bodyText}>
          By using Fitspire, you agree to these terms:
          {'\n\n'}1. You use this app for personal fitness tracking purposes only.
          {'\n\n'}2. The app is provided 'as is' without any warranty.
          {'\n\n'}3. Consult a healthcare professional before starting any fitness program.
          {'\n\n'}4. We are not responsible for any injuries or health issues that may arise.
        </Text>
      </BottomSheet>

      <BottomSheet visible={showBottomSheet === 'about'} onClose={() => setShowBottomSheet(null)} title="About Fitspire">
        <Text style={styles.bodyText}>
          Fitspire v0.1.0
          {'\n\n'}Your personal fitness companion.
          {'\n\n'}Track workouts, monitor nutrition, set goals, and crush them.
          {'\n\n'}Built with React Native & Expo.
        </Text>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  profileCard: { alignItems: 'center', marginBottom: spacing.md, paddingVertical: spacing.xl },
  avatar: { fontSize: 64, marginBottom: spacing.md },
  profileName: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  profileGoal: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs },
  infoCard: { marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.md },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
  infoValue: { color: colors.text, fontWeight: '600', fontSize: fontSize.sm },
  settingsCard: { marginBottom: spacing.md },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: { color: colors.text, fontSize: fontSize.md },
  settingArrow: { color: colors.textMuted, fontSize: fontSize.lg },
  bodyText: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 22, marginBottom: spacing.lg },
});
