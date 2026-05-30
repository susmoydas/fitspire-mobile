import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.titleRow}>
            <MaterialIcons name="error" size={24} color="#EF4444" />
            <Text style={styles.title}> App Error</Text>
          </View>
          <ScrollView style={styles.scroll}>
            <Text style={styles.message}>{this.state.error?.message}</Text>
            <Text style={styles.stack}>{this.state.error?.stack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', paddingTop: 80, paddingHorizontal: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { color: '#EF4444', fontSize: 24, fontWeight: '800' },
  scroll: { flex: 1 },
  message: { color: '#F87171', fontSize: 16, marginBottom: 20, fontFamily: 'monospace' },
  stack: { color: '#94A3B8', fontSize: 12, fontFamily: 'monospace', lineHeight: 18 },
});
