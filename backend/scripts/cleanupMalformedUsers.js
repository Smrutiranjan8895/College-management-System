import { DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../utils/dynamo.js';

const MALFORMED_USER_ID_GUARDS = new Set(['email', 'role', 'name', 'branch']);

function getMalformedReason(item) {
  const rawUserId = item?.userId;
  const normalizedUserId = String(rawUserId || '').trim().toLowerCase();
  const email = String(item?.email || '').trim();
  const createdAt = String(item?.createdAt || '').trim();

  if (!normalizedUserId || MALFORMED_USER_ID_GUARDS.has(normalizedUserId) || normalizedUserId.includes('@')) {
    return 'invalid-userId';
  }

  if (!email) {
    return 'missing-email';
  }

  if (!createdAt) {
    return 'missing-createdAt';
  }

  return null;
}

async function cleanupMalformedUsers() {
  const applyChanges = process.argv.includes('--apply');

  let lastEvaluatedKey;
  let scannedCount = 0;
  let flaggedCount = 0;
  let deletedCount = 0;

  do {
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: TABLES.USERS,
        ProjectionExpression: 'userId, email, createdAt',
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    for (const item of scanResult.Items || []) {
      scannedCount += 1;

      const malformedReason = getMalformedReason(item);
      if (!malformedReason) {
        continue;
      }

      flaggedCount += 1;

      const rawUserId = item?.userId;
      if (!applyChanges) {
        console.log('cleanup-users: flagged malformed user record (dry-run)', {
          tableName: TABLES.USERS,
          userId: rawUserId,
          reason: malformedReason,
        });
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
        reason: malformedReason,
      });
    }

    lastEvaluatedKey = scanResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log('cleanup-users: completed', {
    tableName: TABLES.USERS,
    applyChanges,
    scannedCount,
    flaggedCount,
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
