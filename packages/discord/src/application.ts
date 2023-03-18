import { DISCORD_API_BASEURL } from "./constants";
import { ApplicationCommandData } from "./types";

export interface ApplicationInitialParams {
  apiVersion?: number;
  applicationId?: string;
  botToken?: string;
}

export class Application {
  readonly apiVersion: number = 10;
  readonly applicationId?: string;
  readonly botToken?: string;

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
}
