// Student Handler - Full CRUD operations
// Table: Students (PK: studentId, SK: branch, GSI: branch-index)

import { PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../utils/dynamo.js';
import { ok, err } from '../utils/response.js';
import { getClaims, hasRole, canAccessBranch } from '../utils/verifyToken.js';
import { ensureDummyAcademicDataSeeded } from '../utils/dummyData.js';

export const handler = async (event) => {
  console.log('studentHandler invoked:', JSON.stringify({
    httpMethod: event.httpMethod,
    path: event.path,
    pathParameters: event.pathParameters
  }));

  try {
    const claims = await getClaims(event);
    const { role, branch: userBranch } = claims;

    const method = event.httpMethod;
    const pathParams = event.pathParameters || {};
    const body = event.body ? JSON.parse(event.body) : {};
    const queryParams = event.queryStringParameters || {};

    switch (method) {
      case 'GET':
        if (!hasRole(role, ['admin', 'branch_admin', 'teacher', 'student'])) {
          return err(403, 'Forbidden: Insufficient permissions');
        }
        if (pathParams.studentId) {
          return await getStudent(pathParams.studentId, role, userBranch);
        }
        return await listStudentsByBranch(queryParams, role, userBranch);

      case 'POST':
        if (!hasRole(role, ['admin', 'branch_admin'])) {
          return err(403, 'Forbidden: Only admin or branch_admin can create students');
        }
        return await createStudent(body, role, userBranch, claims.userId);

      case 'PUT':
        if (!hasRole(role, ['admin', 'branch_admin'])) {
          return err(403, 'Forbidden: Only admin or branch_admin can update students');
        }
        if (!pathParams.studentId) {
          return err(400, 'Missing studentId in path');
        }
        return await updateStudent(pathParams.studentId, body, role, userBranch);

      case 'DELETE':
        if (!hasRole(role, ['admin', 'branch_admin'])) {
          return err(403, 'Forbidden: Only admin or branch_admin can delete students');
        }
        if (!pathParams.studentId) {
          return err(400, 'Missing studentId in path');
        }
        return await deleteStudent(pathParams.studentId, body.branch || queryParams.branch, role, userBranch);

      default:
        return err(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Error in studentHandler:', error);
    return err(500, 'Internal server error');
  }
};

// GET single student by ID
async function getStudent(studentId, role, userBranch) {
  console.log('getStudent:', studentId);

  await ensureDummyAcademicDataSeeded();

  // Query to find student by studentId (need to scan or use GSI since we don't know branch)
  const result = await docClient.send(new QueryCommand({
    TableName: TABLES.STUDENTS,
    KeyConditionExpression: 'studentId = :sid',
    ExpressionAttributeValues: {
      ':sid': studentId
    }
  }));

  if (!result.Items || result.Items.length === 0) {
    return err(404, 'Student not found');
  }

  const student = result.Items[0];

  // Check branch access
  if (!canAccessBranch(role, userBranch, student.branch)) {
    return err(403, 'Forbidden: Cannot access students from other branches');
  }

  return ok(200, { data: student, student });
}

// GET all students by branch
async function listStudentsByBranch(queryParams, role, userBranch) {
  const requestedBranch = queryParams?.branch || userBranch;

  await ensureDummyAcademicDataSeeded();

  if (role === 'admin' && !requestedBranch) {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLES.STUDENTS,
    }));

    const students = (result.Items || []).sort((a, b) => (a.rollNumber || a.studentId).localeCompare(b.rollNumber || b.studentId));
    return ok(200, { data: students, students });
  }

  // Check branch access
  if (!canAccessBranch(role, userBranch, requestedBranch)) {
    return err(403, 'Forbidden: Cannot access students from other branches');
  }

  console.log('listStudentsByBranch:', requestedBranch);

  let students = [];

  try {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.STUDENTS,
      IndexName: 'branch-index',
      KeyConditionExpression: 'branch = :branch',
      ExpressionAttributeValues: {
        ':branch': requestedBranch
      }
    }));

    students = result.Items || [];
  } catch (error) {
    // Compatibility fallback for environments where Student table exists without branch-index GSI.
    if (error?.name !== 'ValidationException') {
      throw error;
    }

    console.warn('branch-index missing on Students table, falling back to Scan filter');
    const scanResult = await docClient.send(new ScanCommand({
      TableName: TABLES.STUDENTS,
      FilterExpression: '#branch = :branch',
      ExpressionAttributeNames: {
        '#branch': 'branch'
      },
      ExpressionAttributeValues: {
        ':branch': requestedBranch
      }
    }));

    students = scanResult.Items || [];
  }

  students = students.sort((a, b) => (a.rollNumber || a.studentId).localeCompare(b.rollNumber || b.studentId));
  return ok(200, { data: students, students });
}

// POST create new student
async function createStudent(body, role, userBranch, createdBy) {
  const {
    studentId,
    name,
    email,
    branch,
    semester,
    year,
    department,
    phone,
    rollNumber,
    cognitoSub,
  } = body;

  const normalizedBranch = (branch || '').toUpperCase();
  const normalizedStudentId = (studentId || rollNumber || `STU-${Date.now()}`).toString().trim();
  const normalizedRollNumber = (rollNumber || normalizedStudentId).toString().trim();
  const normalizedSemester = semester !== undefined ? Number(semester) : null;
  const normalizedYear = year !== undefined ? Number(year) : (normalizedSemester ? Math.ceil(normalizedSemester / 2) : null);

  if (!normalizedStudentId || !name || !email || !normalizedBranch) {
    return err(400, 'Missing required fields: name, email, branch, and rollNumber/studentId');
  }

  // Check branch access
  if (!canAccessBranch(role, userBranch, normalizedBranch)) {
    return err(403, 'Forbidden: Cannot create students in other branches');
  }

  console.log('createStudent:', normalizedStudentId, normalizedBranch);

  const now = new Date().toISOString();
  const student = {
    studentId: normalizedStudentId,
    rollNumber: normalizedRollNumber,
    branch: normalizedBranch,
    name,
    email,
    semester: Number.isFinite(normalizedSemester) ? normalizedSemester : null,
    year: Number.isFinite(normalizedYear) ? normalizedYear : null,
    department: department || normalizedBranch,
    phone: phone || null,
    cognitoSub: cognitoSub || null,
    createdAt: now,
    createdBy,
    updatedAt: now,
  };

  await docClient.send(new PutCommand({
    TableName: TABLES.STUDENTS,
    Item: student,
    ConditionExpression: 'attribute_not_exists(studentId) AND attribute_not_exists(branch)'
  }));

  return ok(201, { data: student, student, message: 'Student created successfully' });
}

// PUT update student
async function updateStudent(studentId, body, role, userBranch) {
  const { name, email, year, department, phone } = body;
  let branch = body.branch;

  if (!branch) {
    const studentResult = await docClient.send(new QueryCommand({
      TableName: TABLES.STUDENTS,
      KeyConditionExpression: 'studentId = :sid',
      ExpressionAttributeValues: {
        ':sid': studentId,
      },
      Limit: 1,
    }));

    branch = studentResult.Items?.[0]?.branch;

    if (!branch) {
      return err(404, 'Student not found');
    }
  }

  // Check branch access
  if (!canAccessBranch(role, userBranch, branch)) {
    return err(403, 'Forbidden: Cannot update students in other branches');
  }

  console.log('updateStudent:', studentId, branch);

  const updateParts = [];
  const expressionNames = {};
  const expressionValues = {};

  if (name !== undefined) {
    updateParts.push('#name = :name');
    expressionNames['#name'] = 'name';
    expressionValues[':name'] = name;
  }
  if (email !== undefined) {
    updateParts.push('#email = :email');
    expressionNames['#email'] = 'email';
    expressionValues[':email'] = email;
  }
  if (year !== undefined) {
    updateParts.push('#year = :year');
    expressionNames['#year'] = 'year';
    expressionValues[':year'] = year;
  }
  if (department !== undefined) {
    updateParts.push('#department = :department');
    expressionNames['#department'] = 'department';
    expressionValues[':department'] = department;
  }
  if (phone !== undefined) {
    updateParts.push('#phone = :phone');
    expressionNames['#phone'] = 'phone';
    expressionValues[':phone'] = phone;
  }
  if (body.rollNumber !== undefined) {
    updateParts.push('#rollNumber = :rollNumber');
    expressionNames['#rollNumber'] = 'rollNumber';
    expressionValues[':rollNumber'] = body.rollNumber;
  }
  if (body.semester !== undefined) {
    updateParts.push('#semester = :semester');
    expressionNames['#semester'] = 'semester';
    expressionValues[':semester'] = Number(body.semester);
  }

  if (updateParts.length === 0) {
    return err(400, 'No fields to update');
  }

  // Add updatedAt
  updateParts.push('#updatedAt = :updatedAt');
  expressionNames['#updatedAt'] = 'updatedAt';
  expressionValues[':updatedAt'] = new Date().toISOString();

  const result = await docClient.send(new UpdateCommand({
    TableName: TABLES.STUDENTS,
    Key: { studentId, branch },
    UpdateExpression: `SET ${updateParts.join(', ')}`,
    ExpressionAttributeNames: expressionNames,
    ExpressionAttributeValues: expressionValues,
    ConditionExpression: 'attribute_exists(studentId)',
    ReturnValues: 'ALL_NEW'
  }));

  return ok(200, { data: result.Attributes, student: result.Attributes, message: 'Student updated successfully' });
}

// DELETE student
async function deleteStudent(studentId, branch, role, userBranch) {
  let targetBranch = branch;

  if (!targetBranch) {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.STUDENTS,
      KeyConditionExpression: 'studentId = :sid',
      ExpressionAttributeValues: {
        ':sid': studentId,
      },
    }));

    const candidate = (result.Items || []).find((item) => canAccessBranch(role, userBranch, item.branch));
    targetBranch = candidate?.branch;

    if (!targetBranch) {
      return err(404, 'Student not found or inaccessible');
    }
  }

  // Check branch access
  if (!canAccessBranch(role, userBranch, targetBranch)) {
    return err(403, 'Forbidden: Cannot delete students from other branches');
  }

  console.log('deleteStudent:', studentId, targetBranch);

  await docClient.send(new DeleteCommand({
    TableName: TABLES.STUDENTS,
    Key: { studentId, branch: targetBranch },
    ConditionExpression: 'attribute_exists(studentId)'
  }));

  return ok(200, { message: 'Student deleted successfully' });
}
