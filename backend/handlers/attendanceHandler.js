// Attendance Handler - Mark and query attendance
// Table: Attendance (PK: studentId, SK: dateSubject format: YYYY-MM-DD#Subject)

import { PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../utils/dynamo.js';
import { ok, err } from '../utils/response.js';
import { getClaims, hasRole, canAccessBranch } from '../utils/verifyToken.js';
import { ensureDummyAcademicDataSeeded } from '../utils/dummyData.js';
import { resolveStudentFromClaims } from '../utils/studentResolver.js';

export const handler = async (event) => {
  console.log('attendanceHandler invoked:', JSON.stringify({
    httpMethod: event.httpMethod,
    path: event.path,
    pathParameters: event.pathParameters,
  }));

  try {
    const claims = await getClaims(event);
    const { userId, role, branch: userBranch } = claims;

    const method = event.httpMethod;
    const pathParams = event.pathParameters || {};
    const queryParams = event.queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : {};

    switch (method) {
      case 'GET':
        return await getAttendance(pathParams.studentId, queryParams, claims);

      case 'POST':
        if (!hasRole(role, ['admin', 'branch_admin', 'teacher'])) {
          return err(403, 'Forbidden: Only admin, branch_admin, or teacher can mark attendance');
        }
        return await markAttendance(body, role, userBranch, userId);

      default:
        return err(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Error in attendanceHandler:', error);
    return err(500, 'Internal server error');
  }
};

function computeAttendanceStats(items) {
  const total = items.length;
  const present = items.filter((item) => item.status === 'present').length;
  const absent = total - present;
  const percentage = total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 0;
  return { total, present, absent, percentage };
}

async function getAttendance(studentIdParam, queryParams, claims) {
  await ensureDummyAcademicDataSeeded();

  const { role, branch: userBranch } = claims;
  let studentId = studentIdParam;

  if (!studentId || studentId === 'me') {
    if (role === 'student' || studentId === 'me' || queryParams.scope === 'me') {
      const student = await resolveStudentFromClaims(claims);
      if (!student) {
        return ok(200, { data: [], attendance: [], stats: computeAttendanceStats([]) });
      }
      studentId = student.studentId;
    }
  }

  if (studentId) {
    if (role === 'student') {
      const ownStudent = await resolveStudentFromClaims(claims);
      if (!ownStudent || ownStudent.studentId !== studentId) {
        return err(403, 'Forbidden: Students can only view their own attendance');
      }
    }

    const { date, month, subject, startDate, endDate } = queryParams;

    let keyCondition = 'studentId = :sid';
    const expressionValues = { ':sid': studentId };

    if (date && subject) {
      keyCondition += ' AND dateSubject = :dateSubject';
      expressionValues[':dateSubject'] = `${date}#${subject}`;
    } else if (date) {
      keyCondition += ' AND begins_with(dateSubject, :datePrefix)';
      expressionValues[':datePrefix'] = date;
    } else if (month) {
      keyCondition += ' AND begins_with(dateSubject, :monthPrefix)';
      expressionValues[':monthPrefix'] = month;
    }

    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.ATTENDANCE,
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: expressionValues,
      ScanIndexForward: false,
    }));

    let items = result.Items || [];

    if (subject && !(date && subject)) {
      items = items.filter((item) => item.subject === subject);
    }

    if (startDate && endDate) {
      items = items.filter((item) => item.date >= startDate && item.date <= endDate);
    }

    const stats = computeAttendanceStats(items);
    return ok(200, { data: items, attendance: items, stats, studentId });
  }

  if (!hasRole(role, ['admin', 'branch_admin', 'teacher'])) {
    return err(403, 'Forbidden: Insufficient permissions for branch attendance data');
  }

  const targetBranch = queryParams.branch || userBranch;
  if (targetBranch && !canAccessBranch(role, userBranch, targetBranch)) {
    return err(403, 'Forbidden: Cannot access attendance for other branches');
  }

  const { month, date, subject } = queryParams;
  const expressionValues = {};
  const expressionNames = {
    '#branch': 'branch',
    '#date': 'date',
    '#subject': 'subject',
  };
  const filters = [];

  if (targetBranch) {
    filters.push('#branch = :branch');
    expressionValues[':branch'] = targetBranch;
  }

  if (month) {
    filters.push('begins_with(#date, :month)');
    expressionValues[':month'] = month;
  }

  if (date) {
    filters.push('#date = :date');
    expressionValues[':date'] = date;
  }

  if (subject) {
    filters.push('#subject = :subject');
    expressionValues[':subject'] = subject;
  }

  const scanInput = {
    TableName: TABLES.ATTENDANCE,
  };

  if (filters.length > 0) {
    scanInput.FilterExpression = filters.join(' AND ');
    scanInput.ExpressionAttributeNames = expressionNames;
    scanInput.ExpressionAttributeValues = expressionValues;
  }

  const scanResult = await docClient.send(new ScanCommand(scanInput));
  const attendance = (scanResult.Items || []).sort((a, b) => new Date(b.markedAt || b.date) - new Date(a.markedAt || a.date));

  return ok(200, {
    data: attendance,
    attendance,
    stats: computeAttendanceStats(attendance),
  });
}

async function markAttendance(body, role, userBranch, markedBy) {
  if (Array.isArray(body.records)) {
    return await markAttendanceBatch(body, role, userBranch, markedBy);
  }

  const { studentId, date, subject, status, branch } = body;

  if (!studentId || !date || !subject || !status) {
    return err(400, 'Missing required fields: studentId, date, subject, status');
  }

  if (!['present', 'absent'].includes(status)) {
    return err(400, 'Invalid status. Must be "present" or "absent"');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return err(400, 'Invalid date format. Use YYYY-MM-DD');
  }

  const targetBranch = (branch || userBranch || '').toUpperCase();
  if (targetBranch && !canAccessBranch(role, userBranch, targetBranch)) {
    return err(403, 'Forbidden: Cannot mark attendance for students in other branches');
  }

  const dateSubject = `${date}#${subject}`;
  const now = new Date().toISOString();

  const attendance = {
    studentId,
    dateSubject,
    status,
    subject,
    date,
    branch: targetBranch || null,
    markedBy,
    markedAt: now,
  };

  await docClient.send(new PutCommand({
    TableName: TABLES.ATTENDANCE,
    Item: attendance,
  }));

  return ok(201, {
    data: attendance,
    attendance,
    message: 'Attendance marked successfully',
  });
}

async function markAttendanceBatch(body, role, userBranch, markedBy) {
  const { records } = body;

  if (!records || !Array.isArray(records) || records.length === 0) {
    return err(400, 'Missing required field: records (non-empty array)');
  }

  const defaultDate = body.date;
  const defaultSubject = body.subject;
  const defaultBranch = (body.branch || userBranch || '').toUpperCase();

  const now = new Date().toISOString();
  const results = [];

  for (const record of records) {
    const studentId = record.studentId;
    const date = record.date || defaultDate;
    const subject = record.subject || defaultSubject;
    const status = record.status;
    const branch = (record.branch || defaultBranch || '').toUpperCase();

    if (!studentId || !date || !subject || !['present', 'absent'].includes(status)) {
      results.push({ studentId, success: false, error: 'Invalid record payload' });
      continue;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      results.push({ studentId, success: false, error: 'Invalid date format' });
      continue;
    }

    if (branch && !canAccessBranch(role, userBranch, branch)) {
      results.push({ studentId, success: false, error: 'Forbidden branch access' });
      continue;
    }

    const dateSubject = `${date}#${subject}`;
    const attendance = {
      studentId,
      dateSubject,
      status,
      subject,
      date,
      branch: branch || null,
      markedBy,
      markedAt: now,
    };

    try {
      await docClient.send(new PutCommand({
        TableName: TABLES.ATTENDANCE,
        Item: attendance,
      }));
      results.push({ studentId, success: true });
    } catch (error) {
      results.push({ studentId, success: false, error: error.message });
    }
  }

  const successCount = results.filter((entry) => entry.success).length;
  return ok(200, {
    message: `Marked attendance for ${successCount}/${records.length} students`,
    results,
  });
}

// Backward-compatible export. Existing serverless route maps /attendance/bulk to this file's main handler.
export const batchHandler = handler;
