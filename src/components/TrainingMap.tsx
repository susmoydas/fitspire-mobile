import React, { useRef, useCallback, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { WebView } from 'react-native-webview';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';
import type { Coordinate } from '../types';

interface TrainingMapProps {
  style?: any;
}

export interface TrainingMapRef {
  setUserLocation: (lat: number, lng: number) => void;
  addRoutePoint: (lat: number, lng: number) => void;
  clearRoute: () => void;
  fitBounds: () => void;
  setRoute: (points: Coordinate[]) => void;
  setRouteWithMarkers: (points: Coordinate[], startIdx?: number, endIdx?: number) => void;
}

const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #0F172A; }
    #loading, #error {
      position: absolute; inset: 0; display: flex;
      align-items: center; justify-content: center;
      background: #0F172A; color: #888; font-family: sans-serif;
      font-size: 14px; z-index: 1000;
    }
    #error { display: none; flex-direction: column; gap: 12px; }
    #error .retry { color: #FF7A1A; text-decoration: underline; cursor: pointer; }
    .leaflet-control-attribution { display: none !important; }
    .leaflet-control-zoom { display: none !important; }
    .marker-tooltip { background: #1E293B !important; border: 1px solid #334155 !important; color: #fff !important; font-size: 12px !important; font-weight: 600 !important; padding: 4px 10px !important; border-radius: 8px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.4) !important; }
    .marker-tooltip::before { border-top-color: #1E293B !important; }
  </style>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
</head>
<body>
  <div id="loading">Loading map...</div>
  <div id="error">Failed to load map. <span class="retry" onclick="location.reload()">Tap to retry</span></div>
  <div id="map" style="display:none"></div>
  <script>
    var cmdQueue = [];
    var mapReady = false;

    function initMap() {
      try {
        if (typeof L === 'undefined') throw new Error('Leaflet not loaded');
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false,
        }).setView([20, 0], 2);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '',
        }).addTo(map);

        var userMarker = L.circleMarker([0, 0], {
          radius: 8,
          color: '#FFFFFF',
          fillColor: '#4F7DFF',
          fillOpacity: 1,
          weight: 3,
        }).addTo(map);

        var startIcon = L.divIcon({
          className: '',
          html: '<div style="width:16px;height:16px;background:#4F7DFF;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        var endIcon = L.divIcon({
          className: '',
          html: '<div style="width:16px;height:16px;background:#4F7DFF;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);"><div style="width:6px;height:6px;background:#fff;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"></div></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        var startMarker = L.marker([0, 0], { icon: startIcon });
        var endMarker = L.marker([0, 0], { icon: endIcon });

        var routePoints = [];
        var polyOuter = L.polyline([], {
          color: '#FFFFFF',
          weight: 5,
          opacity: 0.3,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
        var polyInner = L.polyline([], {
          color: '#4F7DFF',
          weight: 2.5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        document.getElementById('loading').style.display = 'none';
        document.getElementById('map').style.display = 'block';

        window.setLocation = function(lat, lng) {
          userMarker.setLatLng([lat, lng]);
          map.setView([lat, lng], map.getZoom());
        };

        window.addRoutePoint = function(lat, lng) {
          routePoints.push([lat, lng]);
          polyOuter.setLatLngs(routePoints);
          polyInner.setLatLngs(routePoints);
          map.panTo([lat, lng]);
        };

        window.clearRoute = function() {
          routePoints = [];
          polyOuter.setLatLngs([]);
          polyInner.setLatLngs([]);
          startMarker.remove();
          endMarker.remove();
          map.setView([20, 0], 2);
        };

        window.fitBounds = function() {
          if (routePoints.length > 0) {
            map.fitBounds(polyOuter.getBounds(), { padding: [50, 50], maxZoom: 16 });
          }
        };

        window.setRoute = function(points) {
          try {
            var parsed = typeof points === 'string' ? JSON.parse(points) : points;
            routePoints = parsed.map(function(p) { return [p.lat !== undefined ? p.lat : p.latitude, p.lng !== undefined ? p.lng : p.longitude]; });
            polyOuter.setLatLngs(routePoints);
            polyInner.setLatLngs(routePoints);
            startMarker.remove(); endMarker.remove();
            if (routePoints.length > 0) {
              var first = routePoints[0];
              startMarker.setLatLng(first).addTo(map);
              startMarker.bindTooltip('Start', { permanent: true, direction: 'right', className: 'marker-tooltip' });
              if (routePoints.length > 1) {
                var last = routePoints[routePoints.length - 1];
                endMarker.setLatLng(last).addTo(map);
                endMarker.bindTooltip('End', { permanent: true, direction: 'right', className: 'marker-tooltip' });
              }
            }
            map.fitBounds(polyOuter.getBounds(), { padding: [50, 50], maxZoom: 16 });
          } catch(e) { window.ReactNativeWebView.postMessage(JSON.stringify({type: 'error', message: e.message})); }
        };

        window.setRouteWithMarkers = function(points, startIdx, endIdx) {
          try {
            var parsed = typeof points === 'string' ? JSON.parse(points) : points;
            routePoints = parsed.map(function(p) { return [p.lat !== undefined ? p.lat : p.latitude, p.lng !== undefined ? p.lng : p.longitude]; });
            polyOuter.setLatLngs(routePoints);
            polyInner.setLatLngs(routePoints);
            startMarker.remove(); endMarker.remove();
            if (routePoints.length > 0) {
              var si = startIdx !== undefined ? Math.min(startIdx, routePoints.length - 1) : 0;
              var ei = endIdx !== undefined ? Math.min(endIdx, routePoints.length - 1) : routePoints.length - 1;
              startMarker.setLatLng(routePoints[si]).addTo(map);
              startMarker.bindTooltip('Start', { permanent: true, direction: 'right', className: 'marker-tooltip' });
              if (routePoints.length > 1) {
                endMarker.setLatLng(routePoints[ei]).addTo(map);
                endMarker.bindTooltip('End', { permanent: true, direction: 'right', className: 'marker-tooltip' });
              }
            }
            map.fitBounds(polyOuter.getBounds(), { padding: [50, 50], maxZoom: 16 });
          } catch(e) { window.ReactNativeWebView.postMessage(JSON.stringify({type: 'error', message: e.message})); }
        };

        mapReady = true;
        cmdQueue.forEach(function(cmd) { try { eval(cmd); } catch(e) {} });
        cmdQueue = [];
        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ready'}));
      } catch(e) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'flex';
        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'error', message: e.message}));
      }
    }

    if (document.readyState === 'complete') { initMap(); }
    else { window.addEventListener('load', initMap); }

    window.addEventListener('error', function(e) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('error').style.display = 'flex';
      window.ReactNativeWebView.postMessage(JSON.stringify({type: 'error', message: e.message}));
    });
  </script>
</body>
</html>
`;

const safeStringify = (obj: unknown): string => {
  try { return JSON.stringify(obj); } catch { return '[]'; }
};

const TrainingMap = forwardRef<TrainingMapRef, TrainingMapProps>(
  ({ style }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const readyRef = useRef(false);
    const [loading, setLoading] = useState(true);
    const [mapError, setMapError] = useState(false);

    const call = useCallback((js: string) => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(js + ';true;');
      }
    }, []);

    const queueOrCall = useCallback((js: string) => {
      if (readyRef.current) {
        call(js);
      } else {
        setTimeout(() => {
          if (readyRef.current) {
            call(js);
          } else {
            call(js);
          }
        }, 1000);
      }
    }, [call]);

    useImperativeHandle(ref, () => ({
      setUserLocation: (lat: number, lng: number) => {
        queueOrCall(`setLocation(${lat}, ${lng})`);
      },
      addRoutePoint: (lat: number, lng: number) => {
        queueOrCall(`addRoutePoint(${lat}, ${lng})`);
      },
      clearRoute: () => {
        queueOrCall('clearRoute()');
      },
      fitBounds: () => {
        queueOrCall('fitBounds()');
      },
      setRoute: (points: Coordinate[]) => {
        const pts = points.map(p => `{"lat":${p.latitude},"lng":${p.longitude}}`);
        queueOrCall(`setRoute([${pts.join(',')}])`);
      },
      setRouteWithMarkers: (points: Coordinate[], startIdx?: number, endIdx?: number) => {
        const pts = points.map(p => `{"lat":${p.latitude},"lng":${p.longitude}}`);
        const si = startIdx ?? 0;
        const ei = endIdx ?? points.length - 1;
        queueOrCall(`setRouteWithMarkers([${pts.join(',')}],${si},${ei})`);
      },
    }));

    const handleMessage = useCallback((event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'ready') {
          readyRef.current = true;
          setLoading(false);
        } else if (data.type === 'error') {
          setLoading(false);
          setMapError(true);
        }
      } catch {}
    }, []);

    return (
      <View style={[styles.container, style]}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
        {mapError && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.errorText}>Unable to load map</Text>
            <Text style={styles.errorSubtext}>Route data is still saved</Text>
          </View>
        )}
        <WebView
          ref={webViewRef}
          source={{ html: MAP_HTML }}
          style={styles.webview}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled={true}
          originWhitelist={['*']}
          onMessage={handleMessage}
          onError={() => { setLoading(false); setMapError(true); }}
        />
      </View>
    );
  }
);

TrainingMap.displayName = 'TrainingMap';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  errorSubtext: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});

export default TrainingMap;
