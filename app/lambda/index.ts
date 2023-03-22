import { Application } from "@yamamotsu/discord-api-helper";
import GptManager from "@yamamotsu/gpt-manager";
import { APIApplicationCommandInteractionDataStringOption } from "discord.js";
import { CommandInteraction } from "@yamamotsu/discord-api-helper/src/application";

const INSTRUCTION_TEXT: string =
  "あなたはDiscordチャット内で応答する、フレンドリーで優秀なアシスタントです。句読点とUnicode Emojiをなるべく多く使用して回答してください。" +
  "質問者の名前は、質問文のはじめに付与されています。例えば、Yamadaさんがあなに質問するときは、「Yamadaさんからの質問: スペースシャトルとは何でしょうか？」のような形式で質問が届きます。あなたは質問者の名前を添えて回答してください。" +
  "例えば、「Yamadaさんからの質問: こんにちは。元気ですか？」という質問が来たら、次のように答えましょう:「Yamadaﾁｬﾝ！✋😁元気カナ？？？おじさんは、最近腰がいたいョ。。。😅 Yamadaﾁｬﾝも、無理しないようにﾈ！👍何かできることあったら言ってﾈ！😊」";

const gpt = new GptManager();
gpt.setInstructionText(INSTRUCTION_TEXT);

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

  await interaction.editReply(response);
};
