/**
 * components/NotificationItem.tsx
 *
 * Renders a single weekly-evaluation notification inside the app's
 * existing notification feed. Tapping it is the entry point into
 * the evaluation flow (typically navigates to EvaluationIntroCard /
 * WeeklyEvaluationScreen).
 */

import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import ChalmersText from './ChalmersText';
import { colors, spacing, radii } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { EvaluationNotification } from '../types/evaluation';

export interface NotificationItemProps {
  notification: EvaluationNotification;
  onPress: (notification: EvaluationNotification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
}) => {
  const { title, body, created_at, is_read } = notification;
  const theme = useTheme();
  const { t } = useI18n();

  const formatTimestamp = (iso: string): string => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return t.notifJustNow;
    if (diffHours < 24) return t.notifHoursAgo(diffHours);

    const diffDays = Math.floor(diffHours / 24);
    return t.notifDaysAgo(diffDays);
  };

  return (
    <Pressable
      onPress={() => onPress(notification)}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: pressed ? theme.pressed : theme.card },
      ]}
      accessibilityRole="button"
      accessibilityLabel={t.notifAccessibilityLabel(
        title,
        is_read ? t.notifRead : t.notifUnread,
      )}
    >
      <View style={styles.indicatorColumn}>
        {!is_read && <View style={styles.unreadDot} />}
      </View>

      <View style={styles.content}>
        <ChalmersText variant="caption2" color={theme.subText}>
          {formatTimestamp(created_at)}
        </ChalmersText>
        <ChalmersText
          variant="heading2"
          style={!is_read ? styles.unreadTitle : styles.title}
        >
          {title}
        </ChalmersText>
        <ChalmersText
          variant="paragraph2"
          color={theme.subText}
          style={styles.body}
          numberOfLines={2}
        >
          {body}
        </ChalmersText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
  },
  indicatorColumn: {
    width: 12,
    alignItems: 'center',
    paddingTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bla,
  },
  content: {
    flex: 1,
  },
  title: {
    marginTop: spacing.xs,
  },
  unreadTitle: {
    fontFamily: 'OpenSans-Bold',
    marginTop: spacing.xs,
  },
  body: {
    marginTop: spacing.xs / 2,
  },
});

export default NotificationItem;
