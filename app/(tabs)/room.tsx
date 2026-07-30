import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

// Context
import { useRoom } from '../../src/state/RoomContext';
import { useReputation } from '../../src/state/ReputationContext';

// Theme
import { colors } from '../../src/theme/colors';
import { fonts, fontSizes } from '../../src/theme/typography';

const CANVAS_BASE_W = 360;
const CANVAS_BASE_H = 300;
const CANVAS_H_PADDING = 16;

export default function RoomScreen() {
  const { roomItems } = useRoom();
  const { budget } = useReputation();
  const { width: screenWidth } = useWindowDimensions();
  const webviewRef = useRef<WebView>(null);

  const scale = (screenWidth - CANVAS_H_PADDING * 2) / CANVAS_BASE_W;
  const canvasW = screenWidth - CANVAS_H_PADDING * 2;
  const canvasH = CANVAS_BASE_H * scale;

  const activeItems = useMemo(() => {
    return [...roomItems]
      .filter((item) => item.currentLevel > 0)
      .sort((a, b) => a.zIndex - b.zIndex);
  }, [roomItems]);

  const isEmpty = activeItems.length === 0;

  // Step 4 - The Bridge (React Native to Canvas): Prepare items for WebView
  const itemsForWebView = useMemo(() => {
    return activeItems.map((item) => {
      const levelData = item.levels[item.currentLevel - 1];
      const source = Image.resolveAssetSource(levelData.imagePath);
      return {
        id: item.id,
        zIndex: item.zIndex,
        position: item.position,
        imageUri: source.uri,
      };
    });
  }, [activeItems]);

  const sendDataToWebView = useCallback(() => {
    if (webviewRef.current) {
      webviewRef.current.postMessage(
        JSON.stringify({
          type: 'RENDER_ITEMS',
          items: itemsForWebView,
        })
      );
    }
  }, [itemsForWebView]);

  useEffect(() => {
    sendDataToWebView();
  }, [sendDataToWebView]);

  // Step 3 & 5 - HTML/Canvas Template & Rendering Logic
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: transparent;
            overflow: hidden;
          }
          canvas {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <canvas id="roomCanvas" width="${CANVAS_BASE_W}" height="${CANVAS_BASE_H}"></canvas>
        <script>
          const canvas = document.getElementById('roomCanvas');
          const ctx = canvas.getContext('2d');
          
          function renderItems(items) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const promises = items.map(item => {
              return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => resolve({ img, item });
                img.onerror = () => resolve({ img: null, item });
                img.src = item.imageUri;
              });
            });

            Promise.all(promises).then(results => {
              // The sequential drawing matches the already z-index sorted items
              results.forEach(result => {
                if (result.img) {
                  const { left, top, width, height } = result.item.position;
                  ctx.drawImage(result.img, left, top, width, height);
                }
              });
            });
          }

          // Handle message coming from React Native
          window.addEventListener('message', function(event) {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'RENDER_ITEMS') {
                renderItems(data.items);
              }
            } catch (e) {
              console.error('Error parsing message', e);
            }
          });
          document.addEventListener('message', function(event) {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'RENDER_ITEMS') {
                renderItems(data.items);
              }
            } catch (e) {
              console.error('Error parsing message', e);
            }
          });
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🛏️ Mühendis Odası</Text>
          <Text style={styles.headerSub}>Kendi alanını yaratmaya başla</Text>
        </View>
        <View style={styles.balanceChip}>
          <Text style={styles.balanceIcon}>💰</Text>
          <Text style={styles.balanceValue}>${budget.toLocaleString('tr-TR')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: CANVAS_H_PADDING }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Room Canvas (WebView) ─────────────────────────────────────────────────── */}
        <View
          style={[
            styles.canvas,
            { width: canvasW, height: canvasH },
          ]}
        >
          {isEmpty && (
            <View style={styles.emptyState} pointerEvents="none">
              <Text style={styles.emptyIcon}>🏗️</Text>
              <Text style={styles.emptyText}>
                Odana henüz hiçbir eşya eklenmedi.{'\n'}
                <Text style={styles.emptyHighlight}>Oda Mağazası</Text> sekmesine git ve başla!
              </Text>
            </View>
          )}

          {/* Step 2 - WebView Setup */}
          <WebView
            ref={webviewRef}
            source={{ html: htmlContent }}
            style={{ width: canvasW, height: canvasH, backgroundColor: 'transparent' }}
            scrollEnabled={false}
            onLoadEnd={sendDataToWebView}
            originWhitelist={['*']}
            javaScriptEnabled={true}
          />
        </View>

        {/* ── Placed-items summary ─────────────────────────────────────────── */}
        {!isEmpty && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yerleştirilen Eşyalar</Text>
            <View style={styles.chipGrid}>
              {[...roomItems]
                .filter((i) => i.currentLevel > 0)
                .map((item) => {
                  const isMax = item.currentLevel >= item.levels.length;
                  return (
                    <View
                      key={item.id}
                      style={[styles.summaryChip, isMax && styles.summaryChipMax]}
                    >
                      <Text style={styles.summaryChipIcon}>{item.icon}</Text>
                      <View>
                        <Text style={styles.summaryChipName}>{item.name}</Text>
                        <Text
                          style={[
                            styles.summaryChipLevel,
                            isMax && styles.summaryChipLevelMax,
                          ]}
                        >
                          {isMax ? 'MAX' : `Seviye ${item.currentLevel} / ${item.levels.length}`}
                        </Text>
                      </View>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        {/* ── Navigation hint ─────────────────────────────────────────────── */}
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>
            💡 Eşya satın almak veya yükseltmek için{' '}
            <Text style={styles.hintHighlight}>🪑 Oda Mağazası</Text> sekmesine geç.
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes['3xl'],
    color: colors.textPrimary,
  },
  headerSub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.positiveBg,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  balanceIcon: { fontSize: 14 },
  balanceValue: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.md,
    color: colors.accentPositive,
  },
  scroll: { flex: 1 },
  scrollContent: {
    alignItems: 'center',
    gap: 16,
  },
  canvas: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0A1019',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  emptyState: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  emptyIcon: { fontSize: 44 },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyHighlight: {
    fontFamily: fonts.bodySemiBold,
    color: colors.accentAlert,
  },
  section: {
    width: '100%',
    gap: 10,
  },
  sectionTitle: {
    fontFamily: fonts.headingSemiBold,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
  },
  chipGrid: { gap: 8 },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  summaryChipMax: {
    borderColor: colors.alertBorder,
    backgroundColor: colors.alertBg,
  },
  summaryChipIcon: { fontSize: 22 },
  summaryChipName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  summaryChipLevel: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.accentPositive,
    marginTop: 1,
  },
  summaryChipLevelMax: {
    color: colors.accentAlert,
    fontFamily: fonts.monoSemiBold,
  },
  hintBox: {
    width: '100%',
    backgroundColor: colors.alertBg,
    borderWidth: 1,
    borderColor: colors.alertBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  hintText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textMuted,
    lineHeight: 18,
  },
  hintHighlight: {
    fontFamily: fonts.bodySemiBold,
    color: colors.accentAlert,
  },
});