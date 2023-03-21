# serverless-handson


## 環境変数の変更

serverless.yml

```
  environment: # 環境変数の定義
    CONNECTIONS_TABLE: 任意のテーブル名
    S3BUCKET: 任意のバケット名
```

＃# デプロイ

```
$ npm -g install serverless
$ aws configure // AWS認証情報の設定
＄ serverless deploy // リソースの作成
```

## Lambda環境変数の追加（AWS　Console上で）

```
WEBSOCKET_URL=https://{生成されたAPIGatewayのURL} を設定
```

## 動作確認

```
$ npm install -g wscat
$ wscat -c  wss://{生成されたAPIGatewayのURL}
Connected (press CTRL+C to quit)
< {"message":"New image uploaded","bucket":"バケット名","key":"キー名"} // S3にファイルをアップロード
> 
```
