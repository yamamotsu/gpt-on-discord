import {
  APIAllowedMentions,
  APIEmbed,
  APIInteractionResponse,
  APIMessageComponent,
  RESTPostAPIWebhookWithTokenJSONBody,
  Snowflake,
} from "discord.js";
import { URLSearchParams } from "url";
import type { InteractionBase } from "./application";

export interface InteractionParams<QueryParamsType = any, BodyType = any> {
  interaction: InteractionBase;
  queryParams?: QueryParamsType;
  json?: BodyType;
}

export const createInteractionResponse = async (
  params: InteractionParams<any, APIInteractionResponse>
) => {
  const {
    interaction: {
      applicationId,
      token,
      app: { baseUrl },
    },
    json,
  } = params;
  const url = baseUrl + `/interactions/${applicationId}/${token}/callback`;

  console.log("replying:", url, json);
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(json),
  });
};

export const deferReply = async (params: InteractionParams) => {
  const { interaction } = params;
  return createInteractionResponse({
    interaction,
    json: {
      type: 5,
    },
  });
};

export interface EditWebhookMessageRequestBody {
  content?: string;
  embeds?: APIEmbed[];
  allowed_mentions?: APIAllowedMentions;
  components?: APIMessageComponent[];
  // TODO: files options
}

export const editOriginalInteractionResponse = async (
  params: InteractionParams<any, EditWebhookMessageRequestBody>
) => {
  const {
    interaction: {
      applicationId,
      token,
      app: { baseUrl },
    },
    json,
  } = params;
  const url =
    baseUrl + `/webhooks/${applicationId}/${token}/messages/@original`;

  console.log("replying:", url, json);
  return fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(json),
  });
};

export type FollowupMessageBody = RESTPostAPIWebhookWithTokenJSONBody;
export const createFollowupMessage = async (
  params: InteractionParams<any, FollowupMessageBody>
) => {
  const {
    interaction: {
      applicationId,
      token,
      app: { baseUrl },
    },
    json,
  } = params;
  const query = new URLSearchParams({ wait: "true" });
  const url = baseUrl + `/webhooks/${applicationId}/${token}?${query}`;

  console.log("creating follow up message:", url, json);

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(json),
  });
};
