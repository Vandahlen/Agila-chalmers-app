/**
 * components/QuestionInput.tsx
 *
 * Renders the correct input control for a question's type: a
 * scale pill row, a single-choice list, or a free-text field.
 */

import React from 'react';
import { Pressable, StyleSheet, TextInput, View, Vibration } from 'react-native';
import { ChalmersText, colors, radii, spacing, useTheme } from 'kar-ui-kit';
import { useI18n } from '../i18n/I18nContext';
import { Question } from '../types/evaluation';

export interface QuestionInputProps {
  question: Question;
  value: string | number | undefined;
  onChange: (value: string | number) => void;
}

const SELECTION_HAPTIC_MS = 10;

const QuestionInput: React.FC<QuestionInputProps> = ({
  question,
  value,
  onChange,
}) => {
  const theme = useTheme();
  const { t } = useI18n();

  const handleSelect = (next: string | number) => {
    Vibration.vibrate(SELECTION_HAPTIC_MS);
    onChange(next);
  };

  if (question.question_type === 'scale') {
    const min = question.scale_min ?? 1;
    const max = question.scale_max ?? 5;
    const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

    return (
      <View style={styles.scaleRow}>
        {options.map((n) => {
          const selected = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => handleSelect(n)}
              style={[
                styles.scalePill,
                { borderColor: theme.border },
                selected && { backgroundColor: colors.bla, borderColor: colors.bla },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <ChalmersText
                variant="paragraph1"
                color={selected ? colors.white : theme.text}
              >
                {n}
              </ChalmersText>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (question.question_type === 'single_choice') {
    return (
      <View style={styles.choiceList}>
        {(question.options ?? []).map((option) => {
          const selected = value === option;
          return (
            <Pressable
              key={option}
              onPress={() => handleSelect(option)}
              style={[
                styles.choiceRow,
                { borderColor: theme.border },
                selected && { borderColor: colors.bla, backgroundColor: theme.selectedTint },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <ChalmersText
                variant="paragraph1"
                color={selected ? colors.bla : theme.text}
              >
                {option}
              </ChalmersText>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <TextInput
      style={[
        styles.textInput,
        { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text },
      ]}
      value={typeof value === 'string' ? value : ''}
      onChangeText={onChange}
      placeholder={t.surveyTextPlaceholder}
      placeholderTextColor={theme.subText}
      multiline
      accessibilityLabel={t.surveyTextAccessibilityLabel}
    />
  );
};

const styles = StyleSheet.create({
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  scalePill: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceList: {
    marginTop: spacing.lg,
  },
  choiceRow: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  textInput: {
    marginTop: spacing.lg,
    minHeight: 96,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
    textAlignVertical: 'top',
    fontSize: 16,
  },
});

export default QuestionInput;
