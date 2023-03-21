const AWS = require('aws-sdk');
const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
  apiVersion: '2018-11-29',
  endpoint: `${process.env.WEBSOCKET_URL}`,
});

// DynamoDBから接続IDを取得する関数
async function getConnectionIds() {
    const params = {
      TableName: process.env.CONNECTIONS_TABLE,
    };
  
    const result = await dynamoDb.scan(params).promise();
    return result.Items.map(item => item.connectionId);
}

const dynamoDb = new AWS.DynamoDB.DocumentClient();

// 接続時の処理
async function onConnect(event) {
  const connectionId = event.requestContext.connectionId;
  const timestamp = Date.now();

  const params = {
    TableName: process.env.CONNECTIONS_TABLE,
    Item: {
      connectionId: connectionId,
      timestamp: timestamp,
    },
  };

  await dynamoDb.put(params).promise();
  return { statusCode: 200 };
}

// 切断時の処理
async function onDisconnect(event) {
  const connectionId = event.requestContext.connectionId;

  const params = {
    TableName: process.env.CONNECTIONS_TABLE,
    Key: {
      connectionId: connectionId,
    },
  };

  await dynamoDb.delete(params).promise();
  return { statusCode: 200 };
}

async function notifyWebSocket(event) {
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

  const connectionIds = await getConnectionIds();

  const payload = JSON.stringify({
    message: 'New image uploaded',
    bucket: bucket,
    key: key
  });

  const promises = connectionIds.map(async (connectionId) => {
    try {
      await apiGatewayManagementApi.postToConnection({
        ConnectionId: connectionId,
        Data: payload,
      }).promise();
    } catch (error) {
      if (error.statusCode === 410) {
        console.log(`Found stale connection: ${connectionId}`);
        // Stale connection found. Remove it from your data store.
        // Add appropriate code to remove the stale connectionId from your data store (e.g., DynamoDB)
      } else {
        console.error('Failed to post to connection', error);
      }
    }
  });

  await Promise.all(promises);
  return { statusCode: 200 };
}

// Lambda関数のエクスポート
module.exports = {
    notifyWebSocket,
    onConnect,
    onDisconnect,
};
