import {
  APIApplicationCommandInteractionDataOption,
  APIChatInputApplicationCommandInteractionData,
  APIInteractionResponse,
  APIInteractionResponseChannelMessageWithSource,
  APIInteractionGuildMember,
  ApplicationCommandType,
  InteractionType,
} from "discord.js";
import nacl from "tweetnacl";
import { DISCORD_API_BASEURL } from "./constants";
import {
  APIChatInputApplicationCommandInteraction,
  ApplicationCommandData,
} from "./types";
import {
  createInteractionResponse,
  deferReply,
  editOriginalInteractionResponse,
  createFollowupMessage,
  FollowupMessageBody,
  EditWebhookMessageRequestBody,
} from "./services";

export interface ApplicationInitialParams {
  apiVersion?: number;
  applicationId?: string;
  botToken?: string;
  publicKey?: string;
}

export class CommandData
  implements APIChatInputApplicationCommandInteractionData
{
  readonly app: Application;
  private command: APIChatInputApplicationCommandInteractionData;

  readonly id: string;
  readonly name: string;
  readonly options?: APIApplicationCommandInteractionDataOption[];
  readonly type: ApplicationCommandType.ChatInput;

  constructor(
    app: Application,
    command: APIChatInputApplicationCommandInteractionData
  ) {
    this.app = app;
    this.command = command;
    this.name = command.name;
    this.options = command.options;
    this.id = command.id;
    this.type = command.type;
  }
}

export class CommandInteraction {
  readonly app: Application;
  readonly interaction: APIChatInputApplicationCommandInteraction;
  readonly type: InteractionType;
  readonly command: CommandData;
  readonly channelId: string;
  readonly applicationId: string;
  readonly token: string;
  readonly member?: APIInteractionGuildMember;

  constructor(
    app: Application,
    interaction: APIChatInputApplicationCommandInteraction
  ) {
    this.app = app;
    this.interaction = interaction;
    this.channelId = interaction.channel_id;
    this.applicationId = interaction.application_id;
    this.type = interaction.type;
    this.token = interaction.token;
    this.member = interaction.member;

    this.command = new CommandData(app, interaction.data);
  }

  async deferReply() {
    deferReply({ interaction: this });
  }

  async editReply(json: EditWebhookMessageRequestBody) {
    const res = await editOriginalInteractionResponse({
      interaction: this,
      json,
    });
    const responseJson = await res.json();
    console.log(`> response: ${res.status} ${res.statusText} ${responseJson}`);
  }

  async reply(json: APIInteractionResponseChannelMessageWithSource) {
    return createInteractionResponse({
      interaction: this,
      json,
    });
  }

  async createFollowupMessage(json: FollowupMessageBody) {
    return createFollowupMessage({
      interaction: this,
      json,
    });
  }
}

export class Application {
  readonly apiVersion: number = 10;
  readonly applicationId?: string;
  readonly botToken?: string;
  readonly publicKey?: string;

  get baseUrl() {
    return `${DISCORD_API_BASEURL}/v${this.apiVersion}`;
  }

  constructor(initialParams?: ApplicationInitialParams) {
    this.apiVersion =
      initialParams?.apiVersion ||
      parseInt(process.env.DISCORD_API_VERSION || "10");
    this.applicationId =
      initialParams?.applicationId || process.env.APPLICATION_ID;
    this.botToken = initialParams?.botToken || process.env.DISCORD_BOT_TOKEN;
    this.publicKey =
      initialParams?.publicKey || process.env.DISCORD_BOT_PUBLIC_KEY;
  }

  async registerAppCommand(command: ApplicationCommandData) {
    if (!this.applicationId || !this.botToken) {
      console.error(
        `the application hasn't been initialized properly. { AppId: ${this.applicationId}, botToken: ${this.botToken} }`
      );
      return;
    }

    const url = this.baseUrl + `/applications/${this.applicationId}/commands`;

    const headers = {
      Authorization: `Bot ${this.botToken}`,
      "Content-Type": "application/json",
    };

    await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(command),
    });
  }

  static verifySignature(props: {
    publicKey: string;
    signature: string;
    timestamp: string;
    body: string;
  }) {
    const { publicKey, signature, timestamp, body } = props;
    const isVerified = nacl.sign.detached.verify(
      Buffer.from(timestamp + body),
      Buffer.from(signature, "hex"),
      Buffer.from(publicKey, "hex")
    );
    return isVerified;
  }

  verifySignature(props: {
    headers: { [key: string]: string | undefined };
    body: string | null;
  }) {
    const { headers, body } = props;
    const signature = headers["x-signature-ed25519"];
    const timestamp = headers["x-signature-timestamp"];

    console.log(`> signature: ${signature} \n> timestamp: ${timestamp}`);
    return (
      !!this.publicKey &&
      !!body &&
      !!signature &&
      !!timestamp &&
      Application.verifySignature({
        publicKey: this.publicKey,
        signature,
        timestamp,
        body,
      })
    );
  }

  createInteraction(json: APIChatInputApplicationCommandInteraction) {
    return new CommandInteraction(this, json);
  }
}
