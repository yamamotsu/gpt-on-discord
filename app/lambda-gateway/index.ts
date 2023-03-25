import type { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import aws from "aws-sdk";
import { Application } from "@yamamotsu/discord-api-helper";

const app = new Application();
const lambda = new aws.Lambda();

const MAIN_FUNCTION_NAME = process.env.LAMBDA_FUNCTION_NAME;
if (!MAIN_FUNCTION_NAME) {
  throw new Error(
    "`LAMBDA_FUNCTION_NAME` is not specified in environment variable."
  );
}

const createResponse = (data: any) => ({
  statusCode: 200,
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
});
const deferReply = () => createResponse({ type: 5 });

const invoke = (props: {
  functionName: string;
  body: any;
  async?: boolean;
}) => {
  const { functionName, body, async = false } = props;
  const params = {
    FunctionName: functionName,
    InvocationType: async ? "Event" : "RequestResponse",
    Payload: JSON.stringify(body), //パラメータ
  };
  return new Promise((resolve, reject) => {
    lambda.invoke(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  console.log("PUBLIC_KEY:", app.publicKey);

  if (!app.verifySignature(event)) {
    return {
      statusCode: 401,
      body: JSON.stringify("invalid request signature"),
    };
  }

  const body = JSON.parse(event.body || "");
  if (body.type === 1) {
    return {
      statusCode: 200,
      body: JSON.stringify({ type: 1 }), // type 1: PONG (ACK)
    };
  }

  if (body.type === 2) {
    console.log("incoming command: ", body.data);
    await invoke({
      functionName: MAIN_FUNCTION_NAME,
      body: event,
      async: true,
    });
    return deferReply();
  }
  return {
    statusCode: 404,
    body: "Command not found",
  };
};
