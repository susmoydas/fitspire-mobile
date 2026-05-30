import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useStore } from '../store/useStore';
import {
  isConnectorAvailable,
  requestConnect,
  fetchHealthData,
  disconnect,
} from '../services/healthService';

type ConnectorId = 'apple_health' | 'google_fit' | 'health_connect' | 'fitbit' | 'samsung_health';

interface ConnectorState {
  id: ConnectorId;
  name: string;
  icon: string;
  connected: boolean;
  available: boolean;
  comingSoon?: boolean;
}

const DEFAULT_CONNECTORS: ConnectorState[] = [
  { id: 'google_fit', name: 'Google Fit', icon: 'google_fit', connected: false, available: false },
  { id: 'health_connect', name: 'Health Connect', icon: 'health_connect', connected: false, available: Platform.OS !== 'ios', comingSoon: Platform.OS === 'ios' },
  { id: 'apple_health', name: 'Apple Health', icon: 'apple_health', connected: false, available: Platform.OS === 'ios' },
  { id: 'samsung_health', name: 'Samsung Health', icon: 'samsung_health', connected: false, available: false, comingSoon: true },
  { id: 'fitbit', name: 'Fitbit', icon: 'fitbit', connected: false, available: false, comingSoon: true },
];

export function useHealthIntegration() {
  const [connectors, setConnectors] = useState<ConnectorState[]>(DEFAULT_CONNECTORS);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const storedConnectors = useStore((s) => s.healthConnectors);
  const setStoredConnectors = useStore((s) => s.setHealthConnectors);

  const syncWithStore = useCallback((list: ConnectorState[]) => {
    return list.map((c) => ({
      ...c,
      connected: storedConnectors[c.id] ?? c.connected,
    }));
  }, [storedConnectors]);

  useEffect(() => {
    setConnectors((prev) => syncWithStore(prev));
  }, [syncWithStore]);

  useEffect(() => {
    async function checkAvailability() {
      const updated = await Promise.all(
        DEFAULT_CONNECTORS.map(async (c) => ({
          ...c,
          connected: storedConnectors[c.id] ?? false,
          available: c.comingSoon ? false : await isConnectorAvailable(c.id),
        }))
      );
      if (mountedRef.current) setConnectors(updated);
    }
    checkAvailability();
  }, []);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleConnect = useCallback(async (id: string) => {
    setCheckingId(id);
    try {
      const granted = await requestConnect(id as ConnectorId);
      if (granted) {
        const updatedConnectors = {
          ...storedConnectors,
          [id]: true,
        };
        setStoredConnectors(updatedConnectors);
        setConnectors((prev) =>
          prev.map((c) => (c.id === id ? { ...c, connected: true } : c))
        );
      }
    } catch {
      // Connection failed silently
    }
    setCheckingId(null);
  }, [storedConnectors, setStoredConnectors]);

  const handleDisconnect = useCallback(async (id: string) => {
    const updatedConnectors = {
      ...storedConnectors,
      [id]: false,
    };
    setStoredConnectors(updatedConnectors);
    setConnectors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, connected: false } : c))
    );
    await disconnect(id as ConnectorId);
  }, [storedConnectors, setStoredConnectors]);

  return {
    connectors,
    checkingId,
    handleConnect,
    handleDisconnect,
  };
}
