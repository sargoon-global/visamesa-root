import type {TFunction} from 'i18next';

export type Modelo790ScriptTheme = {
  primary: string;
  onPrimary: string;
  error: string;
  outline: string;
  surface: string;
};

export type Modelo790ScriptStrings = {
  captchaPlaceholder: string;
  captchaImageAlt: string;
  submit: string;
  downloading: string;
  openingPdf: string;
  theme: Modelo790ScriptTheme;
  captchaRetry: string;
  captchaUnavailableTitle: string;
  captchaUnavailableMessage: string;
  formUnavailableTitle: string;
  formUnavailableMessage: string;
  downloadFailedTitle: string;
  downloadFailedHttpMessage: string;
  downloadFailedReadMessage: string;
  downloadFailedUnexpectedMessage: string;
  downloadFailedRequestMessage: string;
  submitFailedTitle: string;
  submitFailedMessage: string;
  prepareFailedTitle: string;
  prepareFailedMessage: string;
};

export function buildModelo790ScriptStrings(
  t: TFunction<'common'>,
  theme: Modelo790ScriptTheme,
): Modelo790ScriptStrings {
  return {
    captchaPlaceholder: t('modelo790.captcha.placeholder'),
    captchaImageAlt: t('modelo790.captcha.imageAlt'),
    submit: t('actions.continue'),
    downloading: t('modelo790.captcha.downloading'),
    openingPdf: t('modelo790.captcha.openingPdf'),
    theme,
    captchaRetry: t('modelo790.captcha.retry'),
    captchaUnavailableTitle: t('modelo790.errors.captchaUnavailableTitle'),
    captchaUnavailableMessage: t('modelo790.errors.captchaUnavailableMessage'),
    formUnavailableTitle: t('modelo790.errors.formUnavailableTitle'),
    formUnavailableMessage: t('modelo790.errors.formUnavailableMessage'),
    downloadFailedTitle: t('modelo790.errors.downloadFailedTitle'),
    downloadFailedHttpMessage: t('modelo790.errors.downloadFailedHttpMessage'),
    downloadFailedReadMessage: t('modelo790.errors.downloadFailedReadMessage'),
    downloadFailedUnexpectedMessage: t('modelo790.errors.downloadFailedUnexpectedMessage'),
    downloadFailedRequestMessage: t('modelo790.errors.downloadFailedRequestMessage'),
    submitFailedTitle: t('modelo790.errors.submitFailedTitle'),
    submitFailedMessage: t('modelo790.errors.submitFailedMessage'),
    prepareFailedTitle: t('modelo790.errors.prepareFailedTitle'),
    prepareFailedMessage: t('modelo790.errors.prepareFailedMessage'),
  };
}
