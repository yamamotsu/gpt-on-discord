import { Application } from "@yamamotsu/discord-api-helper";
import GptManager from "@yamamotsu/gpt-manager";
import {
  APIApplicationCommandInteractionDataStringOption,
  APIButtonComponent,
  APIMessageComponent,
  ApplicationCommandData,
} from "discord.js";
import {
  CommandInteraction,
  InteractionBase,
  MessageComponentInteraction,
} from "@yamamotsu/discord-api-helper/src/application";

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

const execCompletion = async (props: {
  question: string;
  channelId: string;
  userId: string;
  username: string;
}): Promise<string> => {
  const { question, userId, username, channelId } = props;

  const questionWithAuthor = `${username}さんからの質問: ${question}`;
  const response = await gpt.execChatCompletion({
    historyKey: channelId,
    userId,
    question: questionWithAuthor,
  });

  console.log("response: ", response);
  return response;
};

const execCompletionFromCommandInteraction = async (
  interaction: CommandInteraction
) => {
  const { command, member, channelId } = interaction;
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
    user: { id: userId, username: _username },
    nick,
  } = member;
  const { value: question } =
    options[0] as APIApplicationCommandInteractionDataStringOption;
  const username = nick || _username;

  const response = await execCompletion({
    question,
    channelId,
    username,
    userId,
  });
  const body = `> ${question}\n\n>> <@!${userId}> ${response}`;
  return body;
};

const sendSimpleTextResponse = async (
  interaction: InteractionBase,
  message: string
) => {
  const STEP = 2000;
  await interaction.editReply({
    content: message.slice(0, STEP),
  });

  let i = STEP;
  while (i < message.length) {
    const content = message.slice(i, i + STEP);
    await interaction.createFollowupMessage({
      content,
    });
    i += STEP;
  }
};
const sendInteractiveResponse = async (
  interaction: InteractionBase,
  message: string
) => {
  const STEP = 2000;
  const components: APIMessageComponent[] = [
    {
      type: 1,
      components: [
        {
          type: 2,
          custom_id: "longer",
          label: "Longer",
          style: 1,
        } as APIButtonComponent,
        {
          type: 2,
          custom_id: "clear",
          label: "Clear",
          style: 4,
        } as APIButtonComponent,
      ],
    },
  ];
  await interaction.editReply({
    content: message.slice(0, STEP),
    components,
  });

  let i = STEP;
  while (i < message.length) {
    const content = message.slice(i, i + STEP);
    await interaction.createFollowupMessage({
      content,
    });
    i += STEP;
  }
};

export const handler = async (event: any): Promise<void> => {
  console.log("PUBLIC_KEY:", app.publicKey);

  const json = JSON.parse(event.body || "{}");
  const _interaction = app.createInteraction(json);

  let response = "command not found";
  if (_interaction.type === 2) {
    // if user uses slash command
    const interaction = _interaction as CommandInteraction;
    console.log(interaction.command.options);

    if (interaction.command.name === "gpt") {
      response = await execCompletionFromCommandInteraction(interaction);
      await sendInteractiveResponse(interaction, response);
    } else if (interaction.command.name === "gpt-clear") {
      gpt.clearHistory(interaction.channelId);
      await sendSimpleTextResponse(interaction, "---Memory reset---");
    }
  } else if (_interaction.type === 3) {
    // if user interacts any message component of the response
    const interaction = _interaction as MessageComponentInteraction;
    const { data, channelId, member } = interaction;
    console.log(`> Message component interaction arrived: ${interaction.data}`);
    if (data.custom_id === "clear") {
      gpt.clearHistory(interaction.channelId);
      await sendSimpleTextResponse(interaction, "---Memory reset---");
    } else if (data.custom_id === "longer") {
      response = await execCompletion({
        channelId,
        userId: member?.user.id || "",
        username: member?.nick || member?.user.username || "",
        question:
          "ありがとうございます。もう少し詳しく知りたいので、今の回答をより詳しく説明してくれますか？",
      });
      await sendInteractiveResponse(interaction, response);
    }
  }
};
