// Notice Handler - Post and retrieve notices
// Table: Notices (PK: branch or "ALL", SK: createdAt ISO timestamp)

import { DeleteCommand, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../utils/dynamo.js';
import { ok, err } from '../utils/response.js';
import { getClaims, hasRole } from '../utils/verifyToken.js';
import { ensureDummyAcademicDataSeeded } from '../utils/dummyData.js';

export const handler = async (event) => {
  console.log('noticeHandler invoked:', JSON.stringify({
    httpMethod: event.httpMethod,
    path: event.path,
    pathParameters: event.pathParameters
  }));

  try {
    const claims = await getClaims(event);
    const { userId, role, branch: userBranch, name, email } = claims;

    const method = event.httpMethod;
    const queryParams = event.queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : {};

    switch (method) {
      case 'GET':
        // All authenticated users can view notices
        return await getNotices(queryParams, role, userBranch);

      case 'POST':
        // Admin, branch_admin, and teacher can post notices.
        if (!hasRole(role, ['admin', 'branch_admin', 'teacher'])) {
          return err(403, 'Forbidden: Only admin, branch_admin, or teacher can post notices');
        }
        return await createNotice(body, role, userBranch, userId, name, email);

      case 'DELETE':
        // Only admin and branch_admin can delete notices
        if (!hasRole(role, ['admin', 'branch_admin'])) {
          return err(403, 'Forbidden: Only admin or branch_admin can delete notices');
        }
        return await deleteNotice(queryParams, body, role, userBranch);

      default:
        return err(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Error in noticeHandler:', error);
    return err(500, 'Internal server error');
  }
};

function normalizePriority(priority) {
  const value = (priority || 'MEDIUM').toString().toUpperCase();
  if (value === 'URGENT') return 'HIGH';
  if (!['HIGH', 'MEDIUM', 'LOW'].includes(value)) return 'MEDIUM';
  return value;
}

function normalizePostedBy(userName, role, fallbackEmail) {
  if (userName) return userName;
  if (fallbackEmail) return fallbackEmail.split('@')[0];
  if (role) return role.replace('_', ' ').toUpperCase();
  return 'SYSTEM';
}

// GET notices for a branch (including global "ALL" notices)
async function getNotices(queryParams, role, userBranch) {
  await ensureDummyAcademicDataSeeded();

  const requestedBranch = queryParams.branch || queryParams.targetBranch || userBranch || 'ALL';
  const limit = parseInt(queryParams.limit) || 50;

  console.log('getNotices:', requestedBranch);

  if (role === 'admin' && !queryParams.branch) {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLES.NOTICES,
      Limit: Math.max(limit, 100),
    }));

    const notices = (result.Items || [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    return ok(200, { data: notices, notices });
  }

  if (role !== 'admin' && requestedBranch !== 'ALL' && userBranch && requestedBranch !== userBranch) {
    return err(403, 'Forbidden: Cannot view notices from other branches');
  }

  const branchesToRead = new Set([requestedBranch]);
  if (requestedBranch !== 'ALL') {
    branchesToRead.add('ALL');
  } else if (userBranch && userBranch !== 'ALL') {
    branchesToRead.add(userBranch);
  }

  const branchQueries = [...branchesToRead].map((branchKey) =>
    docClient.send(
      new QueryCommand({
        TableName: TABLES.NOTICES,
        KeyConditionExpression: 'branch = :branch',
        ExpressionAttributeValues: {
          ':branch': branchKey,
        },
        ScanIndexForward: false,
        Limit: limit,
      })
    )
  );

  const queryResults = await Promise.all(branchQueries);
  const allNotices = queryResults
    .flatMap((result) => result.Items || [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const notices = allNotices.slice(0, limit);

  return ok(200, { data: notices, notices });
}

// POST create new notice
async function createNotice(body, role, userBranch, postedByUserId, userName, fallbackEmail) {
  const title = body.title?.trim();
  const content = (body.content || body.description || '').trim();
  const payloadBranch = body.branch || body.targetBranch || userBranch || 'ALL';
  const priority = normalizePriority(body.priority);
  const postedBy = body.postedBy || normalizePostedBy(userName, role, fallbackEmail);

  if (!title || !content) {
    return err(400, 'Missing required fields: title and content/description');
  }

  let targetBranch = payloadBranch;

  if (role === 'branch_admin' && targetBranch !== 'ALL' && targetBranch !== userBranch) {
    return err(403, 'Forbidden: Branch admin can only post to own branch or ALL');
  }

  if (role === 'teacher') {
    if (!userBranch) {
      return err(403, 'Forbidden: Teacher branch is missing in token claims');
    }
    if (targetBranch !== userBranch) {
      return err(403, 'Forbidden: Teachers can only post to their own branch');
    }
  }

  console.log('createNotice:', title, targetBranch);

  const now = new Date().toISOString();

  const notice = {
    branch: targetBranch,
    createdAt: now,
    noticeId: `${targetBranch}#${now}`,
    title,
    content,
    description: content,
    priority,
    postedBy,
    postedByRole: role || 'unknown',
    postedByUserId,
    updatedAt: now
  };

  await docClient.send(new PutCommand({
    TableName: TABLES.NOTICES,
    Item: notice
  }));

  return ok(201, { data: notice, notice, message: 'Notice posted successfully' });
}

// DELETE notice
async function deleteNotice(queryParams, body, role, userBranch) {
  const branch = queryParams.branch || body.branch;
  const createdAt = queryParams.createdAt || body.createdAt;

  if (!branch || !createdAt) {
    return err(400, 'Missing required query parameters: branch, createdAt');
  }

  // Check permissions
  if (role !== 'admin') {
    if (branch !== 'ALL' && branch !== userBranch) {
      return err(403, 'Forbidden: Cannot delete notices from other branches');
    }
  }

  console.log('deleteNotice:', branch, createdAt);

  await docClient.send(new DeleteCommand({
    TableName: TABLES.NOTICES,
    Key: { branch, createdAt },
    ConditionExpression: 'attribute_exists(branch)'
  }));

  return ok(200, { message: 'Notice deleted successfully' });
}
