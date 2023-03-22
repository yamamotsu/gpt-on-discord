import {
  ApplicationCommandData,
  Client,
  CommandInteraction,
  Interaction,
} from "discord.js";
import fs from "fs";

import dotenv from "dotenv";
dotenv.config();

import GptManager, { clearInteractionHistory } from "@yamamotsu/gpt-manager";

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
  commands,
  chatgpt: {
    context: { maxHistories } = {},
    instruction: { default: INSTRUCTION_DEFAULT },
  },
} = config;
console.log("commands:", commands);

const client = new Client({ intents: ["GuildMessages"] });
const gpt = new GptManager({ maxHistories });
gpt.setInstructionText(INSTRUCTION_DEFAULT);

const onGptCommandReceived = async (props: {
  interaction: CommandInteraction;
}) => {
  const {
    interaction: {
      options,
      channelId,
      user: { id: userId, username },
    },
  } = props;
  const { interaction } = props;

  const question = `${options.get("質問")?.value}`;
  console.log(`<${channelId}> ${userId}@${username}:${question}`);

  (async () => {
    try {
      const questionWithUsername = `${username} ${question}`;
      const response = await gpt.execChatCompletion({
        historyKey: channelId,
        userId,
        question: questionWithUsername,
      });
      await interaction.editReply(
        `> ${question}\n\n>> <@!${userId}> ${response}\r\n`
      );
    } catch (error: any) {
      console.error(error);
      await interaction.editReply(
        `> ${question}\n\n>> エラーが発生しました: ${error.message}`
      );
    }
  })();
};

const _onInteractionCreate = async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName: command, channelId } = interaction;

  await interaction.deferReply();

  if (command === "gpt") {
    onGptCommandReceived({ interaction });
  } else if (command === "gpt-clear") {
    clearInteractionHistory(channelId);
    await interaction.editReply("---記憶リセット---");
  }
};

client.once("ready", () => {
  console.log(`${client.user?.tag} Ready`);
});

client.on("ready", async () => {
  await client.application?.commands.set(commands);
});

client.on("interactionCreate", _onInteractionCreate);
client.login(process.env.DISCORD_BOT_TOKEN);
