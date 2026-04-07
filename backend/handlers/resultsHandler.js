// Results Handler - Enter and query academic results with GPA calculation
// Table: Results (PK: studentId, SK: semesterSubject format: SEM5#SubjectName)

import { PutCommand, QueryCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../utils/dynamo.js';
import { ok, err } from '../utils/response.js';
import { getClaims, hasRole, canAccessBranch } from '../utils/verifyToken.js';
import { ensureDummyAcademicDataSeeded } from '../utils/dummyData.js';
import { resolveStudentFromClaims } from '../utils/studentResolver.js';

const GRADE_SCALE = [
  { min: 90, max: 100, grade: 'O', points: 10 },
  { min: 80, max: 89, grade: 'A+', points: 9 },
  { min: 70, max: 79, grade: 'A', points: 8 },
  { min: 60, max: 69, grade: 'B+', points: 7 },
  { min: 50, max: 59, grade: 'B', points: 6 },
  { min: 40, max: 49, grade: 'C', points: 5 },
  { min: 0, max: 39, grade: 'F', points: 0 },
];

function normalizeSemester(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const raw = String(value).trim().toUpperCase();
  if (raw.startsWith('SEM')) {
    return raw;
  }

  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    return `SEM${numeric}`;
  }

  return raw;
}

function calculateGrade(marks, maxMarks) {
  const percentage = (marks / maxMarks) * 100;

  for (const scale of GRADE_SCALE) {
    if (percentage >= scale.min && percentage <= scale.max) {
      return {
        percentage: parseFloat(percentage.toFixed(2)),
        grade: scale.grade,
        gradePoints: scale.points,
      };
    }
  }

  return { percentage: 0, grade: 'F', gradePoints: 0 };
}

function calculateCGPA(results) {
  if (!results || results.length === 0) return 0;
  const totalPoints = results.reduce((sum, row) => sum + (row.gradePoints || 0), 0);
  return parseFloat((totalPoints / results.length).toFixed(2));
}

function buildResultSummary(items) {
  const semesterGroups = {};
  for (const item of items) {
    const sem = item.semester || item.semesterSubject?.split('#')[0] || 'UNKNOWN';
    if (!semesterGroups[sem]) {
      semesterGroups[sem] = [];
    }
    semesterGroups[sem].push(item);
  }

  const semesterGPAs = {};
  for (const [sem, values] of Object.entries(semesterGroups)) {
    semesterGPAs[sem] = calculateCGPA(values);
  }

  return {
    semesterGPAs,
    cgpa: calculateCGPA(items),
  };
}

export const handler = async (event) => {
  console.log('resultsHandler invoked:', JSON.stringify({
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
      case 'GET': {
        await ensureDummyAcademicDataSeeded();
        if (pathParams.studentId) {
          return await getStudentResults(pathParams.studentId, queryParams, claims);
        }
        return await listResults(queryParams, claims);
      }

      case 'POST':
        if (!hasRole(role, ['admin', 'branch_admin', 'teacher'])) {
          return err(403, 'Forbidden: Only admin, branch_admin, or teacher can enter results');
        }
        if (Array.isArray(body.results) || Array.isArray(body.records)) {
          return await batchCreateResults(body, role, userBranch, userId);
        }
        return await createResult(body, role, userBranch, userId);

      case 'PUT':
        if (!hasRole(role, ['admin', 'branch_admin', 'teacher'])) {
          return err(403, 'Forbidden: Only admin, branch_admin, or teacher can update results');
        }
        return await updateResult(body, role, userBranch, userId);

      default:
        return err(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Error in resultsHandler:', error);
    return err(500, 'Internal server error');
  }
};

async function getStudentResults(studentIdParam, queryParams, claims) {
  const { role } = claims;
  let studentId = studentIdParam;

  if (studentId === 'me') {
    const student = await resolveStudentFromClaims(claims);
    if (!student) {
      return ok(200, { data: [], results: [], semesterGPAs: {}, cgpa: 0 });
    }
    studentId = student.studentId;
  }

  if (role === 'student') {
    const ownStudent = await resolveStudentFromClaims(claims);
    if (!ownStudent || ownStudent.studentId !== studentId) {
      return err(403, 'Forbidden: Students can only view their own results');
    }
  }

  const semester = normalizeSemester(queryParams.semester);
  const subject = queryParams.subject;

  let keyCondition = 'studentId = :sid';
  const expressionValues = { ':sid': studentId };

  if (semester) {
    keyCondition += ' AND begins_with(semesterSubject, :semesterPrefix)';
    expressionValues[':semesterPrefix'] = `${semester}#`;
  }

  const result = await docClient.send(new QueryCommand({
    TableName: TABLES.RESULTS,
    KeyConditionExpression: keyCondition,
    ExpressionAttributeValues: expressionValues,
    ScanIndexForward: true,
  }));

  let items = result.Items || [];
  if (subject) {
    items = items.filter((row) => row.subject === subject);
  }

  const summary = buildResultSummary(items);
  return ok(200, {
    data: items,
    results: items,
    ...summary,
  });
}

async function listResults(queryParams, claims) {
  const { role, branch: userBranch } = claims;

  if (role === 'student') {
    return await getStudentResults('me', queryParams, claims);
  }

  if (!hasRole(role, ['admin', 'branch_admin', 'teacher'])) {
    return err(403, 'Forbidden: Insufficient permissions');
  }

  const targetBranch = queryParams.branch || userBranch;
  if (targetBranch && !canAccessBranch(role, userBranch, targetBranch)) {
    return err(403, 'Forbidden: Cannot access results for other branches');
  }

  const semester = normalizeSemester(queryParams.semester);
  const subject = queryParams.subject;
  const studentId = queryParams.studentId;
  const limit = parseInt(queryParams.limit, 10) || 500;

  const expressionNames = {
    '#branch': 'branch',
    '#semester': 'semester',
    '#subject': 'subject',
    '#studentId': 'studentId',
  };
  const expressionValues = {};
  const filters = [];

  if (targetBranch) {
    filters.push('#branch = :branch');
    expressionValues[':branch'] = targetBranch;
  }

  if (semester) {
    filters.push('#semester = :semester');
    expressionValues[':semester'] = semester;
  }

  if (subject) {
    filters.push('#subject = :subject');
    expressionValues[':subject'] = subject;
  }

  if (studentId) {
    filters.push('#studentId = :studentId');
    expressionValues[':studentId'] = studentId;
  }

  const scanInput = {
    TableName: TABLES.RESULTS,
    Limit: limit,
  };

  if (filters.length > 0) {
    scanInput.FilterExpression = filters.join(' AND ');
    scanInput.ExpressionAttributeNames = expressionNames;
    scanInput.ExpressionAttributeValues = expressionValues;
  }

  const scanResult = await docClient.send(new ScanCommand(scanInput));
  const items = (scanResult.Items || []).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  const summary = buildResultSummary(items);
  return ok(200, {
    data: items,
    results: items,
    count: items.length,
    ...summary,
  });
}

async function createResult(body, role, userBranch, enteredBy) {
  const studentId = body.studentId;
  const semester = normalizeSemester(body.semester);
  const subject = body.subject;
  const marks = Number(body.marks);
  const maxMarks = Number(body.maxMarks || 100);
  const branch = (body.branch || userBranch || '').toUpperCase();

  if (!studentId || !semester || !subject || Number.isNaN(marks)) {
    return err(400, 'Missing required fields: studentId, semester, subject, marks');
  }

  if (marks < 0 || marks > maxMarks) {
    return err(400, 'Invalid marks: must be between 0 and maxMarks');
  }

  if (branch && !canAccessBranch(role, userBranch, branch)) {
    return err(403, 'Forbidden: Cannot enter results for students in other branches');
  }

  const semesterSubject = `${semester}#${subject}`;
  const gradeInfo = calculateGrade(marks, maxMarks);
  const now = new Date().toISOString();

  const resultItem = {
    studentId,
    semesterSubject,
    semester,
    subject,
    marks,
    maxMarks,
    ...gradeInfo,
    branch: branch || null,
    enteredBy,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(new PutCommand({
    TableName: TABLES.RESULTS,
    Item: resultItem,
    ConditionExpression: 'attribute_not_exists(studentId) AND attribute_not_exists(semesterSubject)',
  }));

  return ok(201, { data: resultItem, result: resultItem, message: 'Result created successfully' });
}

async function updateResult(body, role, userBranch, updatedBy) {
  const studentId = body.studentId;
  const semester = normalizeSemester(body.semester);
  const subject = body.subject;
  const branch = (body.branch || userBranch || '').toUpperCase();

  if (!studentId || !semester || !subject) {
    return err(400, 'Missing required fields: studentId, semester, subject');
  }

  if (branch && !canAccessBranch(role, userBranch, branch)) {
    return err(403, 'Forbidden: Cannot update results for students in other branches');
  }

  const semesterSubject = `${semester}#${subject}`;
  const updateParts = ['#updatedAt = :updatedAt', '#updatedBy = :updatedBy'];
  const expressionNames = {
    '#updatedAt': 'updatedAt',
    '#updatedBy': 'updatedBy',
  };
  const expressionValues = {
    ':updatedAt': new Date().toISOString(),
    ':updatedBy': updatedBy,
  };

  if (body.marks !== undefined) {
    const marks = Number(body.marks);
    const maxMarks = Number(body.maxMarks || 100);

    if (marks < 0 || marks > maxMarks) {
      return err(400, 'Invalid marks: must be between 0 and maxMarks');
    }

    const gradeInfo = calculateGrade(marks, maxMarks);
    updateParts.push('#marks = :marks');
    updateParts.push('#maxMarks = :maxMarks');
    updateParts.push('#percentage = :percentage');
    updateParts.push('#grade = :grade');
    updateParts.push('#gradePoints = :gradePoints');

    expressionNames['#marks'] = 'marks';
    expressionNames['#maxMarks'] = 'maxMarks';
    expressionNames['#percentage'] = 'percentage';
    expressionNames['#grade'] = 'grade';
    expressionNames['#gradePoints'] = 'gradePoints';

    expressionValues[':marks'] = marks;
    expressionValues[':maxMarks'] = maxMarks;
    expressionValues[':percentage'] = gradeInfo.percentage;
    expressionValues[':grade'] = gradeInfo.grade;
    expressionValues[':gradePoints'] = gradeInfo.gradePoints;
  }

  const result = await docClient.send(new UpdateCommand({
    TableName: TABLES.RESULTS,
    Key: { studentId, semesterSubject },
    UpdateExpression: `SET ${updateParts.join(', ')}`,
    ExpressionAttributeNames: expressionNames,
    ExpressionAttributeValues: expressionValues,
    ConditionExpression: 'attribute_exists(studentId)',
    ReturnValues: 'ALL_NEW',
  }));

  return ok(200, { data: result.Attributes, result: result.Attributes, message: 'Result updated successfully' });
}

async function batchCreateResults(body, role, userBranch, userId) {
  const records = body.results || body.records || [];
  if (!Array.isArray(records) || records.length === 0) {
    return err(400, 'Missing required field: results/records (non-empty array)');
  }

  const defaultSemester = normalizeSemester(body.semester);
  const defaultSubject = body.subject;
  const defaultBranch = (body.branch || userBranch || '').toUpperCase();
  const defaultMaxMarks = Number(body.maxMarks || 100);
  const now = new Date().toISOString();

  const results = [];

  for (const record of records) {
    const studentId = record.studentId;
    const semester = normalizeSemester(record.semester || defaultSemester);
    const subject = record.subject || defaultSubject;
    const marks = Number(record.marks);
    const maxMarks = Number(record.maxMarks || defaultMaxMarks || 100);
    const branch = (record.branch || defaultBranch || '').toUpperCase();

    if (!studentId || !semester || !subject || Number.isNaN(marks) || marks < 0 || marks > maxMarks) {
      results.push({ studentId, success: false, error: 'Invalid result payload' });
      continue;
    }

    if (branch && !canAccessBranch(role, userBranch, branch)) {
      results.push({ studentId, success: false, error: 'Forbidden branch access' });
      continue;
    }

    const semesterSubject = `${semester}#${subject}`;
    const gradeInfo = calculateGrade(marks, maxMarks);
    const item = {
      studentId,
      semesterSubject,
      semester,
      subject,
      marks,
      maxMarks,
      ...gradeInfo,
      branch: branch || null,
      enteredBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await docClient.send(new PutCommand({
        TableName: TABLES.RESULTS,
        Item: item,
      }));
      results.push({ studentId, success: true, grade: gradeInfo.grade });
    } catch (error) {
      results.push({ studentId, success: false, error: error.message });
    }
  }

  const successCount = results.filter((entry) => entry.success).length;
  return ok(200, {
    message: `Saved results for ${successCount}/${records.length} records`,
    results,
  });
}

export const batchHandler = handler;
