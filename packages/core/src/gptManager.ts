import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { pushInteractionHistory, getMessageHistory } from "./historyHelper";
import { OPENAI_MODEL_NAME } from "./types";

export interface GptManagerInitParams {
  apiKey?: string;
  modelName?: OPENAI_MODEL_NAME;
  maxHistories?: number;
}

export default class GptManager {
  readonly apiKey: string;
  readonly modelName: OPENAI_MODEL_NAME;
  readonly maxHistroies: number;
  readonly api: OpenAIApi;
  private _instruction: string | undefined;

  constructor(initialParams?: GptManagerInitParams) {
    this.modelName = (initialParams?.modelName ||
      process.env.MODEL_NAME ||
      "gpt-3.5-turbo") as OPENAI_MODEL_NAME;
    this.maxHistroies =
      initialParams?.maxHistories || parseInt(process.env.MAX_HISTORIES || "5");

    const apiKey = initialParams?.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI API KEY must be specified as the `apiKey` prop or as an `OPENAI_API_KEY` environment variable."
      );
    }
    this.apiKey = apiKey;
    this.api = new OpenAIApi(new Configuration({ apiKey }));
  }

  setInstructionText(instruction: string) {
    this._instruction = instruction;
  }

  private getInstructionMessage(): ChatCompletionRequestMessage | null {
    return this._instruction
      ? {
          role: "system",
          content: this._instruction,
        }
      : null;
  }

  async execChatCompletion(props: {
    historyKey: string;
    userId: string;
    question: string;
  }) {
    const { historyKey, userId, question } = props;
    const context: ChatCompletionRequestMessage[] = [
      ...getMessageHistory(historyKey, this.maxHistroies),
      {
        role: "user",
        content: question,
      },
    ];
    const instruction = this.getInstructionMessage();
    const messages = instruction ? [instruction, ...context] : context;
    console.log("message to be completed:", context);

    const completion = await this.api.createChatCompletion({
      model: this.modelName,
      messages,
    });

    const response = completion.data.choices[0].message?.content.trim() || "";
    pushInteractionHistory({
      historyKey,
      userId,
      question,
      response,
    });
    return response;
  }
}
