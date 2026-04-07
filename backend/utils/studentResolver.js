import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from './dynamo.js';

/**
 * Resolve the student row linked to the signed-in Cognito user.
 * Matching priority: exact email > cognitoSub > studentId fallback.
 */
export async function resolveStudentFromClaims(claims) {
  const normalizedEmail = (claims?.email || '').toLowerCase().trim();
  const userId = claims?.userId || '';
  const preferredBranch = claims?.branch || '';

  if (!normalizedEmail && !userId) {
    return null;
  }

  const scanResult = await docClient.send(new ScanCommand({
    TableName: TABLES.STUDENTS,
  }));

  const rows = scanResult.Items || [];
  const scored = rows
    .map((student) => {
      let score = 0;

      if (normalizedEmail && (student.email || '').toLowerCase() === normalizedEmail) {
        score += 10;
      }

      if (userId && student.cognitoSub === userId) {
        score += 8;
      }

      if (userId && student.studentId === userId) {
        score += 5;
      }

      if (preferredBranch && student.branch === preferredBranch) {
        score += 2;
      }

      return { student, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.student || null;
}
