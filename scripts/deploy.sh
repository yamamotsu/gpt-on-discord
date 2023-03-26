#!/bin/bash
source .env

echo "> deploy.sh $1"
echo "> App ID: $APPLICATION_ID\n> Lambda function names:\n>>> gateway: $LAMBDA_FUNCTION_NAME-gateway\n>>> main: $LAMBDA_FUNCTION_NAME \n> Bot Public Key: $PUBLIC_KEY\n> Discord API Version: $DISCORD_API_VERSION\n> Model Name: $MODEL_NAME"

if [ $1 = gateway -o $1 = all ]; then
    echo "> updating gateway function: $LAMBDA_FUNCTION_NAME-gateway"
    aws lambda update-function-configuration --function-name ${LAMBDA_FUNCTION_NAME}-gateway\
        --timeout 20\
        --runtime "nodejs18.x"\
        --environment "Variables={DISCORD_BOT_PUBLIC_KEY=$PUBLIC_KEY,LAMBDA_FUNCTION_NAME=$LAMBDA_FUNCTION_NAME}"

    cd ./dist/gateway && zip ../gateway -r . && cd ../../

    aws lambda update-function-code --function-name ${LAMBDA_FUNCTION_NAME}-gateway --zip-file fileb://dist/gateway.zip
fi

if [ $1 = main -o $1 = all ]; then
    aws lambda update-function-configuration --function-name $LAMBDA_FUNCTION_NAME\
        --timeout 120\
        --runtime "nodejs18.x"\
        --environment "Variables={APPLICATION_ID=$APPLICATION_ID,DISCORD_BOT_PUBLIC_KEY=$PUBLIC_KEY,DISCORD_API_VERSION=$DISCORD_API_VERSION,MAX_HISTORIES=$MAX_HISTORIES,MODEL_NAME=$MODEL_NAME,OPENAI_API_KEY=$OPENAI_API_KEY}"

    cd ./dist/lambda && zip ../lambda -r . && cd ../../

    aws lambda update-function-code --function-name $LAMBDA_FUNCTION_NAME --zip-file fileb://dist/lambda.zip
fi
