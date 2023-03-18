export type ChannelId = string;
export type UserId = string;

export interface QuestionAndResponse {
  user: UserId;
  question: string;
  response: string;
}
