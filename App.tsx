/**
 * App.tsx
 *
 * Entry point wiring the weekly evaluation module into the app.
 * Replace the placeholder `notifications` state and
 * `studentContext` with your real app state (e.g. from your
 * notification store and logged-in student's profile) once those
 * exist - this gives you a working, tappable flow in the meantime.
 */

import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, SafeAreaView, StyleSheet, StatusBar, View } from 'react-native';

import NotificationItem from './src/weekly-evaluation/components/NotificationItem';
import EvaluationIntroCard from './src/weekly-evaluation/components/EvaluationIntroCard';
import WeeklyEvaluationScreen from './src/weekly-evaluation/screens/WeeklyEvaluationScreen';
import { createSupabaseEvaluationRepository } from './src/weekly-evaluation/services/SupabaseEvaluationRepository';
import { EvaluationNotification } from './src/weekly-evaluation/types/evaluation';
import { postgrest } from './src/config/supabase';
import { colors } from './src/weekly-evaluation/theme/theme';
import ErrorBoundary from './src/components/ErrorBoundary';

const repository = createSupabaseEvaluationRepository(postgrest);

type FlowStep = 'feed' | 'intro' | 'survey';

function App(): React.JSX.Element {
  const [step, setStep] = useState<FlowStep>('feed');
  const [notifications, setNotifications] = useState<EvaluationNotification[]>([
    {
      id: 'notif-1',
      title: 'Weekly study check-in',
      body: 'Tell us how this week went - takes about a minute.',
      created_at: new Date().toISOString(),
      is_read: false,
      type: 'weekly_evaluation',
    },
  ]);
  const [activeNotificationId, setActiveNotificationId] = useState<string | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);

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
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

        {step === 'feed' && (
          <FlatList
            style={styles.feed}
            contentContainerStyle={styles.feedContent}
            data={notifications}
            keyExtractor={(n) => n.id}
            renderItem={({ item }) => (
              <NotificationItem notification={item} onPress={handleNotificationPress} />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
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
