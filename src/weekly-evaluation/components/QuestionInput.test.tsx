import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ThemeProvider, colors } from 'kar-ui-kit';
import QuestionInput from './QuestionInput';
import { I18nProvider } from '../i18n/I18nContext';
import { Question } from '../types/evaluation';

const SCALE_QUESTION: Question = {
  id: 'q1',
  order_index: 1,
  question_text: 'How was your week?',
  question_type: 'scale',
  scale_min: 1,
  scale_max: 5,
};

let activeRenderer: ReactTestRenderer.ReactTestRenderer | undefined;

afterEach(() => {
  ReactTestRenderer.act(() => {
    activeRenderer?.unmount();
  });
  activeRenderer = undefined;
});

function render(section: 'hem' | 'mat' | 'event' | 'extra') {
  ReactTestRenderer.act(() => {
    activeRenderer = ReactTestRenderer.create(
      <ThemeProvider section={section}>
        <I18nProvider>
          <QuestionInput
            question={SCALE_QUESTION}
            value={3}
            onChange={() => {}}
          />
        </I18nProvider>
      </ThemeProvider>,
    );
  });
  return activeRenderer!;
}

test('selected scale pill uses the section accent, not hardcoded blue', () => {
  const output = JSON.stringify(render('mat').toJSON());
  expect(output).toContain(colors.gron);
  expect(output).not.toContain(colors.bla);
});

test('the same component is blue under the hem section', () => {
  const output = JSON.stringify(render('hem').toJSON());
  expect(output).toContain(colors.bla);
});
