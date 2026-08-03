import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nProvider, useI18n } from './I18nContext';

function Probe(): React.JSX.Element {
  const { lang, toggleLang } = useI18n();
  return React.createElement('probe' as any, { lang, toggleLang });
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('defaults to sv and persists a toggle to en across remounts', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
  });

  let probe = renderer!.root.findByType('probe' as any);
  expect(probe.props.lang).toBe('sv');

  await ReactTestRenderer.act(async () => {
    probe.props.toggleLang();
  });

  probe = renderer!.root.findByType('probe' as any);
  expect(probe.props.lang).toBe('en');

  const stored = await AsyncStorage.getItem('weekly-evaluation.language');
  expect(stored).toBe('en');

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
  });

  probe = renderer!.root.findByType('probe' as any);
  expect(probe.props.lang).toBe('en');
});
