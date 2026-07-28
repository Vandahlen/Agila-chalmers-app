/**
 * components/ErrorBoundary.tsx
 *
 * App-root safety net. Without this, an uncaught render error
 * anywhere in the tree (e.g. a bad survey response) crashes the
 * whole app instead of showing a recoverable fallback screen.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import ChalmersText from '../weekly-evaluation/components/ChalmersText';
import ChalmersButton from '../weekly-evaluation/components/ChalmersButton';
import { colors, spacing } from '../weekly-evaluation/theme/theme';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

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
      return (
        <View style={styles.container}>
          <ChalmersText variant="heading1" style={styles.title}>
            Something went wrong
          </ChalmersText>
          <ChalmersText variant="paragraph1" color={colors.varmGra} style={styles.body}>
            Please try again. If this keeps happening, restart the app.
          </ChalmersText>
          <ChalmersButton label="Try again" onPress={this.handleReset} variant="primary" />
        </View>
      );
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
    backgroundColor: colors.white,
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
