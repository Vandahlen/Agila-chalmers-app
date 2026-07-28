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
import { EvaluationNotification } from '../types/evaluation';

export interface NotificationItemProps {
  notification: EvaluationNotification;
  onPress: (notification: EvaluationNotification) => void;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
}) => {
  const { title, body, created_at, is_read } = notification;

  return (
    <Pressable
      onPress={() => onPress(notification)}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${is_read ? 'Read' : 'Unread'} notification.`}
    >
      <View style={styles.indicatorColumn}>
        {!is_read && <View style={styles.unreadDot} />}
      </View>

      <View style={styles.content}>
        <ChalmersText
          variant="heading2"
          style={!is_read ? styles.unreadTitle : undefined}
        >
          {title}
        </ChalmersText>
        <ChalmersText
          variant="paragraph2"
          color={colors.varmGra}
          style={styles.body}
          numberOfLines={2}
        >
          {body}
        </ChalmersText>
        <ChalmersText variant="caption2" color={colors.varmGra} style={styles.timestamp}>
          {formatTimestamp(created_at)}
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
    backgroundColor: colors.white,
  },
  pressed: {
    backgroundColor: '#F5F9FC',
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
  unreadTitle: {
    fontFamily: 'OpenSans-Bold',
  },
  body: {
    marginTop: spacing.xs / 2,
  },
  timestamp: {
    marginTop: spacing.xs,
  },
});

export default NotificationItem;
