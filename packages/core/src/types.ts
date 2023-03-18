export const OPENAI_MODEL_NAME = {
  "gpt-3.5": "gpt-3.5",
  "gpt-3.5-turbo": "gpt-3.5-turbo",
} as const;

export type OPENAI_MODEL_NAME =
  (typeof OPENAI_MODEL_NAME)[keyof typeof OPENAI_MODEL_NAME];

export type HistoryKey = string;
export type UserId = string;

export interface QuestionAndResponse {
  user: UserId;
  question: string;
  response: string;
}
