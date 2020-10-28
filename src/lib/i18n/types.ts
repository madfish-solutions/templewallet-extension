export interface FetchedLocaleMessages {
  target: LocaleMessages | null;
  fallback: LocaleMessages | null;
}

export type Substitutions = string | (string | number)[];

export type LocaleMessages = Record<string, LocaleMessage>;

export type LocaleMessage = {
  message: string;
  description?: string;
  placeholders?: Record<string, { content: string }>;
  placeholderList?: string[];
};
