/**
 * i18n/translations.ts
 *
 * Every user-facing string in the weekly evaluation module, in
 * English and Swedish. Question/answer text itself comes from the
 * backend (see types/evaluation.ts) and is out of scope here - this
 * only covers static app copy (buttons, labels, states).
 */

export type Language = 'en' | 'sv';

export interface Translation {
  introTitle: string;
  introDescriptionDefault: string;
  introBadge: string;
  introStartButton: string;

  notifJustNow: string;
  notifHoursAgo: (hours: number) => string;
  notifDaysAgo: (days: number) => string;
  notifRead: string;
  notifUnread: string;
  notifAccessibilityLabel: (title: string, status: string) => string;

  surveyLoadError: string;
  surveyTryAgain: string;
  surveyEmpty: string;
  surveySubmitError: string;
  surveyBack: string;
  surveyNext: string;
  surveySubmit: string;
  surveyProgress: (step: number, total: number) => string;
  surveyTextPlaceholder: string;
  surveyTextAccessibilityLabel: string;

  demoNotifTitle: string;
  demoNotifBody: string;
  demoLangToggle: string;

  errorBoundaryTitle: string;
  errorBoundaryBody: string;
  errorBoundaryRetry: string;
}

export const translations: Record<Language, Translation> = {
  en: {
    introTitle: 'Weekly study check-in',
    introDescriptionDefault:
      'Once a week we ask a few quick questions about how your studies are going. ' +
      'It takes about a minute, your answers are anonymous, and they help the ' +
      'student union spot problems early.',
    introBadge: 'Fully anonymous · no ID attached',
    introStartButton: 'Start Evaluation',

    notifJustNow: 'Just now',
    notifHoursAgo: (hours) => `${hours}h ago`,
    notifDaysAgo: (days) => `${days}d ago`,
    notifRead: 'Read',
    notifUnread: 'Unread',
    notifAccessibilityLabel: (title, status) => `${title}. ${status} notification.`,

    surveyLoadError: "Couldn't load this week's questions.",
    surveyTryAgain: 'Try again',
    surveyEmpty: 'No evaluation questions are available right now.',
    surveySubmitError: 'Something went wrong submitting your answers. Please try again.',
    surveyBack: 'Back',
    surveyNext: 'Next',
    surveySubmit: 'Submit',
    surveyProgress: (step, total) => `Question ${step} of ${total}`,
    surveyTextPlaceholder: 'Type your answer',
    surveyTextAccessibilityLabel: 'Free-text answer',

    demoNotifTitle: 'Weekly study check-in',
    demoNotifBody: 'Tell us how this week went - takes about a minute.',
    demoLangToggle: 'SV',

    errorBoundaryTitle: 'Something went wrong',
    errorBoundaryBody: 'Please try again. If this keeps happening, restart the app.',
    errorBoundaryRetry: 'Try again',
  },
  sv: {
    introTitle: 'Veckans studiekoll',
    introDescriptionDefault:
      'En gång i veckan ställer vi några snabba frågor om hur dina studier går. ' +
      'Det tar ungefär en minut, dina svar är anonyma och de hjälper kåren att ' +
      'upptäcka problem tidigt.',
    introBadge: 'Helt anonymt · ingen identifiering',
    introStartButton: 'Starta utvärdering',

    notifJustNow: 'Just nu',
    notifHoursAgo: (hours) => `${hours}h sedan`,
    notifDaysAgo: (days) => `${days}d sedan`,
    notifRead: 'Läst',
    notifUnread: 'Oläst',
    notifAccessibilityLabel: (title, status) => `${title}. ${status} avisering.`,

    surveyLoadError: 'Kunde inte hämta veckans frågor.',
    surveyTryAgain: 'Försök igen',
    surveyEmpty: 'Inga utvärderingsfrågor är tillgängliga just nu.',
    surveySubmitError: 'Något gick fel när dina svar skickades. Försök igen.',
    surveyBack: 'Tillbaka',
    surveyNext: 'Nästa',
    surveySubmit: 'Skicka',
    surveyProgress: (step, total) => `Fråga ${step} av ${total}`,
    surveyTextPlaceholder: 'Skriv ditt svar',
    surveyTextAccessibilityLabel: 'Fritextsvar',

    demoNotifTitle: 'Veckans studiekoll',
    demoNotifBody: 'Berätta hur veckan har varit - tar ungefär en minut.',
    demoLangToggle: 'EN',

    errorBoundaryTitle: 'Något gick fel',
    errorBoundaryBody: 'Försök igen. Om detta fortsätter, starta om appen.',
    errorBoundaryRetry: 'Försök igen',
  },
};
