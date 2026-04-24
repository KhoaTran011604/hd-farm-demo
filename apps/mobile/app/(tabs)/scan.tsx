import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { QrScanner } from '../../components/qr-scanner';
import { ScanResultSheet } from '../../components/scan-result-sheet';
import type { Animal } from '../../lib/types';

type ScannedAnimal = Pick<Animal, 'id' | 'name' | 'species' | 'status' | 'qrCode'> & {
  penName?: string;
  zoneName?: string;
};

const recentScans: string[] = [];

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [scannedUuid, setScannedUuid] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [torch, setTorch] = useState(false);
  const [recents, setRecents] = useState<string[]>([...recentScans]);

  const scanY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, { toValue: 230, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanY, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [scanY]);

  const { data: animal, isLoading, isError } = useQuery<ScannedAnimal>({
    queryKey: ['animal-by-qr', scannedUuid],
    queryFn: () => api.get(`/animals/by-qr/${scannedUuid}`).then((r) => r.data),
    enabled: !!scannedUuid,
    retry: false,
  });

  const handleScanned = useCallback((data: string) => {
    setScannedUuid(data);
    setSheetOpen(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setSheetOpen(false);
    setScannedUuid(null);
  }, []);

  useEffect(() => {
    if (animal && !recentScans.includes(animal.name)) {
      recentScans.unshift(animal.name);
      if (recentScans.length > 6) recentScans.pop();
      setRecents([...recentScans]);
    }
  }, [animal]);

  const cameraActive = !sheetOpen;

  return (
    <View style={s.screen}>
      <StatusBar style="light" />
      <QrScanner onScanned={handleScanned} active={cameraActive} torch={torch} />

      {/* OVERLAY */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* TOP BAR */}
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={s.circleBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={s.topTitle}>{t('scan.title')}</Text>
          <TouchableOpacity style={[s.circleBtn, torch && s.circleBtnActive]} onPress={() => setTorch((v) => !v)}>
            <Ionicons name="flashlight-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* VIEWFINDER */}
        <View style={s.viewfinderWrap} pointerEvents="none">
          <Text style={s.hint}>{t('scan.hint')}</Text>
          <View style={s.viewfinder}>
            <View style={[s.corner, s.cornerTL]} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />
            <Animated.View style={[s.scanLine, { transform: [{ translateY: scanY }] }]} />
          </View>

          <TouchableOpacity style={s.manualBtn} onPress={() => {}}>
            <Ionicons name="search-outline" size={16} color="#fff" />
            <Text style={s.manualBtnTxt}>{t('scan.manualSearch')}</Text>
          </TouchableOpacity>
        </View>

        {/* RECENT SCANS */}
        {recents.length > 0 && (
          <View style={s.recentSection} pointerEvents="auto">
            <Text style={s.recentLabel}>{t('scan.recentLabel')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {recents.map((name) => (
                <TouchableOpacity key={name} style={s.recentChip}>
                  <Text style={s.recentChipTxt}>{name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* LOADING STATE */}
        {isLoading && scannedUuid && (
          <View style={s.stateOverlay}>
            <Text style={s.stateTxt}>{t('scan.searching')}</Text>
          </View>
        )}

        {/* ERROR STATE */}
        {isError && scannedUuid && (
          <View style={s.stateOverlay}>
            <Text style={s.errorTxt}>{t('scan.notFound')}</Text>
            <TouchableOpacity onPress={handleDismiss} style={s.retryBtn}>
              <Text style={s.retryTxt}>{t('scan.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {sheetOpen && animal && (
        <ScanResultSheet animal={animal} onDismiss={handleDismiss} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  circleBtnActive: { backgroundColor: 'rgba(45,80,22,0.4)' },
  topTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  viewfinderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', marginBottom: 20 },
  viewfinder: { width: 240, height: 240, position: 'relative' },
  corner: { position: 'absolute', width: 28, height: 28 },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#fff', borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#fff', borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#fff', borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#fff', borderBottomRightRadius: 4 },
  scanLine: { position: 'absolute', left: 2, right: 2, height: 2, backgroundColor: '#7CB518', borderRadius: 1, shadowColor: '#7CB518', shadowOpacity: 1, shadowRadius: 4 },
  manualBtn: { marginTop: 20, height: 44, paddingHorizontal: 20, borderRadius: 22, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center', gap: 8 },
  manualBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
  recentSection: { paddingHorizontal: 16, paddingBottom: 24 },
  recentLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  recentChip: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  recentChipTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },
  stateOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', gap: 16 },
  stateTxt: { color: '#fff', fontSize: 16 },
  errorTxt: { color: '#fca5a5', fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { backgroundColor: '#1A3009', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryTxt: { color: '#fff', fontWeight: '600' },
});
