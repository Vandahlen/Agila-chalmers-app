/**
 * components/QuestionInput.tsx
 *
 * Renders the correct input control for a question's type: a
 * scale pill row, a single-choice list, or a free-text field.
 */

import React from 'react';
import { Pressable, StyleSheet, TextInput, View, Vibration } from 'react-native';
import ChalmersText from './ChalmersText';
import { colors, radii, spacing } from '../theme/theme';
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
              style={[styles.scalePill, selected && styles.scalePillSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <ChalmersText
                variant="paragraph1"
                color={selected ? colors.white : colors.black}
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
              style={[styles.choiceRow, selected && styles.choiceRowSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <ChalmersText
                variant="paragraph1"
                color={selected ? colors.bla : colors.black}
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
      style={styles.textInput}
      value={typeof value === 'string' ? value : ''}
      onChangeText={onChange}
      placeholder="Type your answer"
      placeholderTextColor={colors.disabledText}
      multiline
      accessibilityLabel="Free-text answer"
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
    borderColor: colors.disabledBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scalePillSelected: {
    backgroundColor: colors.bla,
    borderColor: colors.bla,
  },
  choiceList: {
    marginTop: spacing.lg,
  },
  choiceRow: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.disabledBackground,
    marginBottom: spacing.sm,
  },
  choiceRowSelected: {
    borderColor: colors.bla,
    backgroundColor: '#EAF7FF',
  },
  textInput: {
    marginTop: spacing.lg,
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.disabledBackground,
    borderRadius: radii.sm,
    padding: spacing.md,
    textAlignVertical: 'top',
    fontSize: 16,
    color: colors.black,
  },
});

export default QuestionInput;
