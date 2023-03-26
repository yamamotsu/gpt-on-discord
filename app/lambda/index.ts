import { Application } from "@yamamotsu/discord-api-helper";
import GptManager from "@yamamotsu/gpt-manager";
import {
  APIApplicationCommandInteractionDataStringOption,
  ApplicationCommandData,
} from "discord.js";
import { CommandInteraction } from "@yamamotsu/discord-api-helper/src/application";

import fs from "fs";

interface AppConfig {
  chatgpt: {
    instruction: {
      default: string;
    };
    context?: {
      maxHistories?: number;
    };
  };
  commands: ApplicationCommandData[];
}
const config: AppConfig = JSON.parse(fs.readFileSync("./config.json", "utf-8"));
const {
  chatgpt: {
    context: { maxHistories } = {},
    instruction: { default: INSTRUCTION_DEFAULT },
  },
} = config;

const gpt = new GptManager({ maxHistories });
gpt.setInstructionText(INSTRUCTION_DEFAULT);

const app = new Application();

const execCompletion = async (
  interaction: CommandInteraction
): Promise<string> => {
  const { command, channelId, member } = interaction;
  const { options } = command;

  if (
    !options ||
    options.length === 0 ||
    options[0].name !== "question" ||
    !member
  ) {
    return "Invalid options";
  }

  const {
    user: { id: userId, username },
  } = member;
  const { value: question } =
    options[0] as APIApplicationCommandInteractionDataStringOption;

  const questionWithAuthor = `${username}さんからの質問: ${question}`;
  const response = await gpt.execChatCompletion({
    historyKey: channelId,
    userId,
    question: questionWithAuthor,
  });

  const body = `> ${question}\n\n>> <@!${userId}> ${response}`;
  console.log("response: ", body);
  return body;
};

export const handler = async (event: any): Promise<void> => {
  console.log("PUBLIC_KEY:", app.publicKey);

  const json = JSON.parse(event.body || "{}");
  const interaction = app.createInteraction(json);

  let response = "command not found";
  if (interaction.type === 2) {
    console.log(interaction.command.options);

    if (interaction.command.name === "gpt") {
      response = await execCompletion(interaction);
    } else if (interaction.command.name === "gpt-clear") {
      gpt.clearHistory(interaction.channelId);
      response = "---Memory reset---";
    }
  }

  const STEP = 2000;
  await interaction.editReply({
    content: response.slice(0, STEP),
  });

  let i = STEP;
  while (i < response.length) {
    const content = response.slice(i, i + STEP);
    await interaction.createFollowupMessage({
      content,
    });
    i += STEP;
  }
};
