/**
 * App.tsx
 *
 * Entry point wiring the weekly evaluation module into the app.
 * Replace the placeholder `notifications` state and
 * `studentContext` with your real app state (e.g. from your
 * notification store and logged-in student's profile) once those
 * exist - this gives you a working, tappable flow in the meantime.
 *
 * Stands in for the kårapp host: wraps the module in ThemeProvider
 * (dark mode via system setting) and I18nProvider (EN/SV), and
 * renders a language toggle in the header - the module itself
 * exposes toggleLang but renders no switcher of its own, since a
 * real host app would place that wherever its own navigation does.
 */

import React, { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import NotificationItem from './src/weekly-evaluation/components/NotificationItem';
import EvaluationIntroCard from './src/weekly-evaluation/components/EvaluationIntroCard';
import WeeklyEvaluationScreen from './src/weekly-evaluation/screens/WeeklyEvaluationScreen';
import ChalmersText from './src/weekly-evaluation/components/ChalmersText';
import { createSupabaseEvaluationRepository } from './src/weekly-evaluation/services/SupabaseEvaluationRepository';
import { EvaluationNotification } from './src/weekly-evaluation/types/evaluation';
import { postgrest } from './src/config/supabase';
import { colors } from './src/weekly-evaluation/theme/theme';
import { ThemeProvider, useTheme } from './src/weekly-evaluation/theme/ThemeContext';
import { I18nProvider, useI18n } from './src/weekly-evaluation/i18n/I18nContext';
import ErrorBoundary from './src/components/ErrorBoundary';

const repository = createSupabaseEvaluationRepository(postgrest);

type FlowStep = 'feed' | 'intro' | 'survey';

interface NotificationCore {
  id: string;
  created_at: string;
  is_read: boolean;
}

function AppContent(): React.JSX.Element {
  const isDark = useColorScheme() === 'dark';
  const theme = useTheme();
  const { t, toggleLang } = useI18n();

  const [step, setStep] = useState<FlowStep>('feed');
  const [notifications, setNotifications] = useState<NotificationCore[]>([
    { id: 'notif-1', created_at: new Date().toISOString(), is_read: false },
  ]);
  const [activeNotificationId, setActiveNotificationId] = useState<string | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);

  const localizedNotifications: EvaluationNotification[] = notifications.map((n) => ({
    ...n,
    title: t.demoNotifTitle,
    body: t.demoNotifBody,
    type: 'weekly_evaluation' as const,
  }));

  const handleNotificationPress = (notification: EvaluationNotification) => {
    setActiveNotificationId(notification.id);
    setStep('intro');
  };

  const handleFinished = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    setStep('feed');
    setActiveNotificationId(null);
  };

  const handleRefresh = useCallback(async () => {
    // No notification-fetching backend exists yet - once one does,
    // re-fetch the feed here. For now this just gives the pull-to-refresh
    // gesture a working spinner instead of doing nothing silently.
    setRefreshing(true);
    setRefreshing(false);
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {step === 'feed' && (
          <>
            <View style={styles.headerRow}>
              <ChalmersText variant="heading1">{t.introTitle}</ChalmersText>
              <TouchableOpacity onPress={toggleLang} accessibilityRole="button">
                <ChalmersText variant="paragraph1" color={colors.bla}>
                  {t.demoLangToggle}
                </ChalmersText>
              </TouchableOpacity>
            </View>
            <FlatList
              style={styles.feed}
              contentContainerStyle={styles.feedContent}
              data={localizedNotifications}
              keyExtractor={(n) => n.id}
              renderItem={({ item }) => (
                <NotificationItem notification={item} onPress={handleNotificationPress} />
              )}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
            />
          </>
        )}

        {step === 'intro' && (
          <View style={styles.centeredPadded}>
            <EvaluationIntroCard onStart={() => setStep('survey')} />
          </View>
        )}

        {step === 'survey' && activeNotificationId && (
          <WeeklyEvaluationScreen
            repository={repository}
            notificationId={activeNotificationId}
            studentContext={{ program: 'Computer Science', study_year: 2 }}
            onEvaluationFinished={handleFinished}
            onCancel={() => setStep('feed')}
          />
        )}
      </SafeAreaView>
    </ErrorBoundary>
  );
}

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    padding: 16,
  },
  centeredPadded: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
});

export default App;
