/**
 * components/ErrorBoundary.tsx
 *
 * App-root safety net. Without this, an uncaught render error
 * anywhere in the tree (e.g. a bad survey response) crashes the
 * whole app instead of showing a recoverable fallback screen.
 *
 * Class components can't use hooks, so the themed/localized
 * fallback UI is a separate function component rendered by the
 * class boundary - it still runs inside ThemeProvider/I18nProvider
 * since those wrap ErrorBoundary's children, not the other way
 * around.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import ChalmersText from '../weekly-evaluation/components/ChalmersText';
import ChalmersButton from '../weekly-evaluation/components/ChalmersButton';
import { spacing } from '../weekly-evaluation/theme/theme';
import { useTheme } from '../weekly-evaluation/theme/ThemeContext';
import { useI18n } from '../weekly-evaluation/i18n/I18nContext';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

const ErrorFallback: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ChalmersText variant="heading1" style={styles.title}>
        {t.errorBoundaryTitle}
      </ChalmersText>
      <ChalmersText variant="paragraph1" color={theme.subText} style={styles.body}>
        {t.errorBoundaryBody}
      </ChalmersText>
      <ChalmersButton label={t.errorBoundaryRetry} onPress={onRetry} variant="primary" />
    </View>
  );
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Unhandled error in app tree:', error);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleReset} />;
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  body: {
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
});

export default ErrorBoundary;
