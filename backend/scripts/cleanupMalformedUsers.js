import { DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../utils/dynamo.js';

const MALFORMED_USER_ID_GUARDS = new Set(['email', 'role', 'name']);

async function cleanupMalformedUsers() {
  let lastEvaluatedKey;
  let deletedCount = 0;

  do {
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: TABLES.USERS,
        ProjectionExpression: 'userId',
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    for (const item of scanResult.Items || []) {
      const rawUserId = item?.userId;
      const normalizedUserId = String(rawUserId || '').trim().toLowerCase();
      if (!MALFORMED_USER_ID_GUARDS.has(normalizedUserId)) {
        continue;
      }

      await docClient.send(
        new DeleteCommand({
          TableName: TABLES.USERS,
          Key: { userId: rawUserId },
        })
      );

      deletedCount += 1;
      console.log('cleanup-users: deleted malformed user record', {
        tableName: TABLES.USERS,
        userId: rawUserId,
      });
    }

    lastEvaluatedKey = scanResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log('cleanup-users: completed', {
    tableName: TABLES.USERS,
    deletedCount,
  });
}

cleanupMalformedUsers().catch((error) => {
  console.error('cleanup-users: failed', {
    tableName: TABLES.USERS,
    errorName: error?.name || 'UnknownError',
    errorMessage: error?.message || 'No error message provided',
  });

  process.exitCode = 1;
});
