import type _LocaleMessages from '../../../public/_locales/en/messages.json';

export type TID = keyof typeof _LocaleMessages;

export interface FetchedLocaleMessages {
  target: LocaleMessages | null;
  fallback: LocaleMessages | null;
}

export type Substitutions = string | string[];

export type LocaleMessages = Record<string, LocaleMessage>;

export type LocaleMessage = {
  message: string;
  description?: string;
  placeholders?: Record<string, { content: string }>;
  placeholderList?: string[];
};
