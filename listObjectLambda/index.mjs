import { S3Client, ListObjectsCommand } from "@aws-sdk/client-s3";

export const handler = async(event) => {
    const bucketName = process.env.BUCKET_NAME;
    const client = new S3Client({ region: "ap-northeast-1" });
    const command = new ListObjectsCommand({
        Bucket: bucketName,
    });
    const res = await client.send(command);
    
    let result = [];
    res['Contents'].reverse().forEach((element) => {
        result.push({
            key: element['Key'],
            modified: element['LastModified']
        })
    });
    return result;
};