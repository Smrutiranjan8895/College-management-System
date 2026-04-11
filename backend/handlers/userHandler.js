import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminListGroupsForUserCommand,
  AdminRemoveUserFromGroupCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  CreateGroupCommand,
  GetGroupCommand,
  ListUsersCommand,
  ListUsersInGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

import { err, ok } from '../utils/response.js';
import { docClient, TABLES } from '../utils/dynamo.js';
import { getClaims, hasRole } from '../utils/verifyToken.js';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || process.env.DYNAMODB_REGION || 'ap-south-1',
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const ROLE_VALUES = ['admin', 'branch_admin', 'teacher', 'student'];
const BRANCH_VALUES = ['ALL', 'CS', 'EC', 'ME', 'CE', 'EE'];
const PROFILE_ROLE_VALUES = ['student', 'teacher', 'admin'];
const MALFORMED_USER_ID_GUARDS = new Set(['email', 'role', 'name']);
const COGNITO_SUB_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROLE_ALIAS_MAP = {
  admin: 'admin',
  admins: 'admin',
  branch_admin: 'branch_admin',
  'branch-admin': 'branch_admin',
  'branch admin': 'branch_admin',
  branchadmin: 'branch_admin',
  teacher: 'teacher',
  teachers: 'teacher',
  faculty: 'teacher',
  student: 'student',
  students: 'student',
};

function parseBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return null;
  }
}

function isPath(event, expected) {
  const resource = (event.resource || '').replace(/\/+$/, '');
  const path = (event.path || '').replace(/\/+$/, '');
  return resource === expected || path.endsWith(expected);
}

function normalizeRole(value, fallback = 'student') {
  const raw = (value || '').toString().trim().toLowerCase();
  if (!raw) {
    return fallback;
  }

  const underscored = raw.replace(/[\s-]+/g, '_');
  return ROLE_ALIAS_MAP[underscored] || ROLE_ALIAS_MAP[raw] || fallback;
}

function normalizeBranch(value, fallback = 'CS') {
  return (value || fallback).toString().trim().toUpperCase();
}

function normalizeEmail(value) {
  return (value || '').toString().trim().toLowerCase();
}

function normalizeGroupsClaim(value) {
  if (Array.isArray(value)) {
    return value.map((group) => String(group).trim().toLowerCase()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((group) => group.trim().toLowerCase())
      .filter(Boolean);
  }

  return [];
}

function resolveProfileRoleFromClaims(claims) {
  const groups = normalizeGroupsClaim(claims?.['cognito:groups'] || claims?.groups);
  const normalizedRoles = groups.map((group) => normalizeRole(group, ''));

  if (normalizedRoles.includes('admin') || normalizedRoles.includes('branch_admin')) {
    return 'admin';
  }
  if (normalizedRoles.includes('teacher')) {
    return 'teacher';
  }

  return 'student';
}

function buildUserProfileFromClaims(claims) {
  return {
    userId: String(claims?.userId || claims?.sub || '').trim(),
    email: normalizeEmail(claims?.email),
    role: resolveProfileRoleFromClaims(claims),
    createdAt: new Date().toISOString(),
  };
}

function isMalformedUserProfile(profile) {
  const userId = String(profile?.userId || '').trim().toLowerCase();
  return MALFORMED_USER_ID_GUARDS.has(userId);
}

function isValidCognitoSubUserId(userId) {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    return false;
  }

  if (MALFORMED_USER_ID_GUARDS.has(normalizedUserId.toLowerCase())) {
    return false;
  }

  return COGNITO_SUB_REGEX.test(normalizedUserId);
}

function normalizePhone(value) {
  if (!value) return null;
  const sanitized = String(value).replace(/\s+/g, '');
  if (!sanitized) return null;
  if (sanitized.startsWith('+')) return sanitized;
  if (/^\d{10}$/.test(sanitized)) return `+91${sanitized}`;
  return sanitized;
}

function looksLikeEmail(value) {
  return /^\S+@\S+\.\S+$/.test(String(value || '').trim());
}

function generateUsernameFromEmail(email) {
  const localPart = String(email || '')
    .split('@')[0]
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
  const safeLocal = (localPart || 'user').slice(0, 18);
  const randomPart = Math.random().toString(36).slice(2, 8);
  const timePart = Date.now().toString(36);
  return `${safeLocal}_${timePart}_${randomPart}`;
}

function resolveUsername(payload, email) {
  const requestedUsername = String(payload?.username || '').trim();
  if (!requestedUsername || looksLikeEmail(requestedUsername)) {
    return generateUsernameFromEmail(email);
  }

  const sanitized = requestedUsername.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
  if (!sanitized || looksLikeEmail(sanitized)) {
    return generateUsernameFromEmail(email);
  }

  return sanitized;
}

async function resolveUsernameFromClaims(claims) {
  if (claims?.username) {
    return String(claims.username);
  }

  const email = normalizeEmail(claims?.email);
  if (!email) {
    return null;
  }

  const response = await cognitoClient.send(
    new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `email = \"${email}\"`,
      Limit: 1,
    })
  );

  return response.Users?.[0]?.Username || null;
}

function readAttributeMap(attributes = []) {
  const map = {};
  for (const attr of attributes) {
    if (!attr?.Name) continue;
    map[attr.Name] = attr.Value;
  }
  return map;
}

function buildUserAttributes(payload, includeCustomAttributes = true) {
  const role = normalizeRole(payload.role, 'student');
  const branch = normalizeBranch(payload.branch || 'CS');
  const email = normalizeEmail(payload.email);
  const phone = normalizePhone(payload.phone);

  const attrs = [
    { Name: 'email', Value: email },
    { Name: 'email_verified', Value: 'true' },
  ];

  if (payload.name) {
    attrs.push({ Name: 'name', Value: String(payload.name).trim() });
  }

  if (phone) {
    attrs.push({ Name: 'phone_number', Value: phone });
  }

  if (includeCustomAttributes) {
    attrs.push({ Name: 'custom:role', Value: role });
    if (branch !== 'ALL') {
      attrs.push({ Name: 'custom:branch', Value: branch });
    }
  }

  return attrs;
}

function generateStrongPassword() {
  const randomPart = Math.random().toString(36).slice(-6);
  const numericPart = String(Date.now()).slice(-4);
  return `Gcek@${randomPart}${numericPart}!`;
}

async function getUserProfileById(userId) {
  if (!userId) {
    return null;
  }

  const result = await docClient.send(
    new GetCommand({
      TableName: TABLES.USERS,
      Key: { userId },
    })
  );

  return result.Item || null;
}

async function initUserProfile(claims) {
  const profile = buildUserProfileFromClaims(claims);

  if (!profile.userId || !profile.email) {
    console.warn('users/init: rejected due to missing JWT claims', {
      hasUserId: Boolean(profile.userId),
      hasEmail: Boolean(profile.email),
      source: 'jwt',
    });
    return err(400, 'Missing required JWT claims: sub and email');
  }

  if (!PROFILE_ROLE_VALUES.includes(profile.role)) {
    profile.role = 'student';
  }

  if (isMalformedUserProfile(profile)) {
    console.warn('users/init: prevented malformed profile write', {
      userId: profile.userId,
      email: profile.email,
      role: profile.role,
      tableName: TABLES.USERS,
    });
    return ok(200, {
      data: null,
      created: false,
      skipped: true,
      reason: 'malformed-user-id',
    });
  }

  if (!isValidCognitoSubUserId(profile.userId)) {
    console.warn('users/init: blocked invalid Cognito sub format', {
      userId: profile.userId,
      email: profile.email,
      role: profile.role,
      tableName: TABLES.USERS,
    });

    return ok(200, {
      data: null,
      created: false,
      skipped: true,
      reason: 'invalid-user-id',
    });
  }

  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLES.USERS,
        Item: profile,
        ConditionExpression: 'attribute_not_exists(userId)',
      })
    );

    console.log('users/init: created user profile', {
      userId: profile.userId,
      role: profile.role,
      tableName: TABLES.USERS,
    });

    return ok(201, {
      data: profile,
      created: true,
    });
  } catch (error) {
    if (error?.name === 'ConditionalCheckFailedException') {
      const latest = await getUserProfileById(profile.userId);
      console.log('users/init: user profile already exists', {
        userId: profile.userId,
        tableName: TABLES.USERS,
      });

      return ok(200, {
        data: latest || profile,
        created: false,
      });
    }

    console.error('users/init: failed to create user profile', {
      userId: profile.userId,
      email: profile.email,
      role: profile.role,
      tableName: TABLES.USERS,
      errorName: error?.name || 'UnknownError',
      errorMessage: error?.message || 'No error message provided',
    });

    throw error;
  }
}

async function listGroupsForUser(username) {
  try {
    const response = await cognitoClient.send(
      new AdminListGroupsForUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      })
    );

    return (response.Groups || [])
      .map((group) => String(group?.GroupName || '').trim().toLowerCase())
      .filter(Boolean);
  } catch (error) {
    console.warn('listGroupsForUser failed:', username, error?.name || error?.message);
    return [];
  }
}

async function ensureGroup(groupName) {
  try {
    await cognitoClient.send(
      new GetGroupCommand({
        GroupName: groupName,
        UserPoolId: USER_POOL_ID,
      })
    );
  } catch (error) {
    if (error?.name !== 'ResourceNotFoundException') {
      throw error;
    }

    await cognitoClient.send(
      new CreateGroupCommand({
        GroupName: groupName,
        UserPoolId: USER_POOL_ID,
      })
    );
  }
}

async function syncUserRoleGroup(username, role) {
  const targetRole = normalizeRole(role, 'student');
  if (!ROLE_VALUES.includes(targetRole)) {
    throw new Error('Invalid role value');
  }

  await ensureGroup(targetRole);
  const currentGroups = await listGroupsForUser(username);

  for (const groupName of currentGroups) {
    const normalizedGroupRole = normalizeRole(groupName, '');
    if (ROLE_VALUES.includes(normalizedGroupRole) && normalizedGroupRole !== targetRole) {
      await cognitoClient.send(
        new AdminRemoveUserFromGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
          GroupName: groupName,
        })
      );
    }
  }

  const hasTargetRole = currentGroups.some((groupName) => normalizeRole(groupName, '') === targetRole);
  if (!hasTargetRole) {
    await cognitoClient.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        GroupName: targetRole,
      })
    );
  }

  return targetRole;
}

function toUserSummary(userLike, groups = []) {
  const attributes = readAttributeMap(userLike?.Attributes || userLike?.UserAttributes || []);
  const roleFromGroup = groups
    .map((group) => normalizeRole(group, ''))
    .find((groupRole) => ROLE_VALUES.includes(groupRole));

  return {
    username: userLike?.Username || attributes.email || null,
    email: attributes.email || null,
    name: attributes.name || null,
    phone: attributes.phone_number || null,
    role: normalizeRole(attributes['custom:role'] || roleFromGroup || 'student'),
    branch: normalizeBranch(attributes['custom:branch'] || attributes['custom:department'] || 'CS'),
    status: userLike?.UserStatus || 'UNKNOWN',
    enabled: typeof userLike?.Enabled === 'boolean' ? userLike.Enabled : true,
    createdAt: userLike?.UserCreateDate || null,
    lastModifiedAt: userLike?.UserLastModifiedDate || null,
    groups,
  };
}

async function getUserRoleContext(username) {
  const response = await cognitoClient.send(
    new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    })
  );

  const attrs = readAttributeMap(response.UserAttributes || []);
  const groups = await listGroupsForUser(username);
  const roleFromGroups = groups
    .map((group) => normalizeRole(group, ''))
    .find((groupRole) => ROLE_VALUES.includes(groupRole));
  const roleFromCustom = normalizeRole(attrs['custom:role'], '');

  return {
    explicitRole: roleFromCustom || roleFromGroups || '',
    branch: normalizeBranch(attrs['custom:branch'] || attrs['custom:department'] || 'CS'),
  };
}

async function updateUserAttributesWithCustomFallback(username, attributes) {
  if (!attributes.length) {
    return;
  }

  try {
    await cognitoClient.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        UserAttributes: attributes,
      })
    );
  } catch (error) {
    const canRetryWithoutCustomAttrs =
      error?.name === 'InvalidParameterException' &&
      String(error?.message || '').toLowerCase().includes('custom:');

    if (!canRetryWithoutCustomAttrs) {
      throw error;
    }

    const fallbackAttributes = attributes.filter((attr) => !attr.Name.startsWith('custom:'));
    if (fallbackAttributes.length > 0) {
      await cognitoClient.send(
        new AdminUpdateUserAttributesCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
          UserAttributes: fallbackAttributes,
        })
      );
    }
  }
}

async function isAdminBootstrapAllowed() {
  try {
    const response = await cognitoClient.send(
      new ListUsersInGroupCommand({
        UserPoolId: USER_POOL_ID,
        GroupName: 'admin',
        Limit: 1,
      })
    );

    return (response.Users || []).length === 0;
  } catch (error) {
    if (error?.name === 'ResourceNotFoundException') {
      return true;
    }

    throw error;
  }
}

async function setSelfRole(claims, body) {
  const username = await resolveUsernameFromClaims(claims);
  if (!username) {
    return err(400, 'Could not resolve current user identity');
  }

  const requestedRole = normalizeRole(body.role, 'student');
  const requestedBranch = normalizeBranch(body.branch, requestedRole === 'admin' ? 'ALL' : 'CS');

  if (!ROLE_VALUES.includes(requestedRole)) {
    return err(400, 'Invalid role');
  }

  if (!BRANCH_VALUES.includes(requestedBranch)) {
    return err(400, 'Invalid branch');
  }

  const current = await getUserRoleContext(username);

  if (current.explicitRole && current.explicitRole !== requestedRole) {
    return err(409, `Role is already assigned as ${current.explicitRole}`);
  }

  const adminSelfAssignEnabled = String(process.env.ALLOW_ADMIN_SELF_ASSIGN || 'true').toLowerCase() !== 'false';
  if (!adminSelfAssignEnabled && requestedRole === 'admin' && current.explicitRole !== 'admin') {
    const allowBootstrapAdmin = await isAdminBootstrapAllowed();
    if (!allowBootstrapAdmin) {
      return err(403, 'Admin self-assignment is disabled. Contact an existing admin.');
    }
  }

  const attributes = [{ Name: 'custom:role', Value: requestedRole }];
  if (requestedBranch !== 'ALL') {
    attributes.push({ Name: 'custom:branch', Value: requestedBranch });
  }

  await updateUserAttributesWithCustomFallback(username, attributes);
  await syncUserRoleGroup(username, requestedRole);

  const updatedUser = await getUserByUsername(username);
  return ok(200, {
    data: {
      ...updatedUser,
      roleAssigned: true,
    },
    user: {
      ...updatedUser,
      roleAssigned: true,
    },
  });
}

async function getUserByUsername(username) {
  const response = await cognitoClient.send(
    new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    })
  );

  const groups = await listGroupsForUser(username);
  return toUserSummary(response, groups);
}

async function getSelfProfile(claims) {
  return ok(200, {
    data: claims,
    user: claims,
  });
}

async function listUsers(queryParams) {
  const limit = Math.min(Math.max(parseInt(queryParams.limit || '40', 10) || 40, 1), 60);
  const requestedRole = queryParams.role ? normalizeRole(queryParams.role, '') : '';
  const requestedBranch = queryParams.branch ? normalizeBranch(queryParams.branch, '') : '';

  const response = await cognitoClient.send(
    new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Limit: limit,
      PaginationToken: queryParams.nextToken || undefined,
    })
  );

  const usersWithGroups = await Promise.all(
    (response.Users || []).map(async (user) => {
      const groups = await listGroupsForUser(user.Username);
      return toUserSummary(user, groups);
    })
  );

  const filteredUsers = usersWithGroups.filter((user) => {
    if (requestedRole && user.role !== requestedRole) {
      return false;
    }
    if (requestedBranch && user.branch !== requestedBranch) {
      return false;
    }
    return true;
  });

  return ok(200, {
    data: filteredUsers,
    users: filteredUsers,
    nextToken: response.PaginationToken || null,
  });
}

async function checkEmailAvailability(queryParams) {
  const email = normalizeEmail(queryParams.email);
  if (!email) {
    return err(400, 'Email query parameter is required');
  }

  const response = await cognitoClient.send(
    new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${email}"`,
      Limit: 20,
    })
  );

  const users = (response.Users || []).map((user) => ({
    username: user.Username,
    status: user.UserStatus || 'UNKNOWN',
    createdAt: user.UserCreateDate || null,
  }));

  const hasConfirmed = users.some((user) => user.status === 'CONFIRMED');
  const hasUnconfirmed = users.some((user) => user.status === 'UNCONFIRMED');
  const exists = users.length > 0;

  return ok(200, {
    data: {
      email,
      exists,
      available: !exists,
      hasConfirmed,
      hasUnconfirmed,
      usersCount: users.length,
      latestStatus: users[0]?.status || null,
    },
  });
}

async function createUser(body) {
  const email = normalizeEmail(body.email);
  const username = resolveUsername(body, email);
  const name = (body.name || '').toString().trim();
  const role = normalizeRole(body.role, 'teacher');
  const branch = normalizeBranch(body.branch, 'CS');
  const password = body.password ? String(body.password) : generateStrongPassword();

  if (!email) return err(400, 'Email is required');
  if (!name) return err(400, 'Name is required');
  if (!ROLE_VALUES.includes(role)) return err(400, 'Invalid role');
  if (!BRANCH_VALUES.includes(branch)) return err(400, 'Invalid branch');
  if (password.length < 8) return err(400, 'Password must be at least 8 characters long');

  const createInput = {
    UserPoolId: USER_POOL_ID,
    Username: username,
    MessageAction: 'SUPPRESS',
    DesiredDeliveryMediums: [],
    UserAttributes: buildUserAttributes({ ...body, email, name, role, branch }, true),
  };

  try {
    await cognitoClient.send(new AdminCreateUserCommand(createInput));
  } catch (error) {
    const canRetryWithoutCustomAttrs =
      error?.name === 'InvalidParameterException' &&
      String(error?.message || '').toLowerCase().includes('custom:');

    if (!canRetryWithoutCustomAttrs) {
      throw error;
    }

    await cognitoClient.send(
      new AdminCreateUserCommand({
        ...createInput,
        UserAttributes: buildUserAttributes({ ...body, email, name, role, branch }, false),
      })
    );
  }

  await cognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      Password: password,
      Permanent: true,
    })
  );

  await syncUserRoleGroup(username, role);

  const createdUser = await getUserByUsername(username);

  return ok(201, {
    data: createdUser,
    user: createdUser,
    generatedPassword: body.password ? null : password,
  });
}

async function updateUser(username, body) {
  const role = body.role ? normalizeRole(body.role, 'student') : null;
  const branch = body.branch ? normalizeBranch(body.branch, 'CS') : null;
  const name = body.name ? String(body.name).trim() : null;
  const email = body.email ? normalizeEmail(body.email) : null;
  const phone = body.phone ? normalizePhone(body.phone) : null;
  const password = body.password ? String(body.password) : null;

  if (role && !ROLE_VALUES.includes(role)) return err(400, 'Invalid role');
  if (branch && !BRANCH_VALUES.includes(branch)) return err(400, 'Invalid branch');
  if (password && password.length < 8) return err(400, 'Password must be at least 8 characters long');

  const updateAttributes = [];
  if (name) updateAttributes.push({ Name: 'name', Value: name });
  if (email) {
    updateAttributes.push({ Name: 'email', Value: email });
    updateAttributes.push({ Name: 'email_verified', Value: 'true' });
  }
  if (phone) updateAttributes.push({ Name: 'phone_number', Value: phone });
  if (role) updateAttributes.push({ Name: 'custom:role', Value: role });
  if (branch && branch !== 'ALL') updateAttributes.push({ Name: 'custom:branch', Value: branch });

  if (updateAttributes.length > 0) {
    await updateUserAttributesWithCustomFallback(username, updateAttributes);
  }

  if (password) {
    await cognitoClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        Password: password,
        Permanent: true,
      })
    );
  }

  if (role) {
    await syncUserRoleGroup(username, role);
  }

  const updatedUser = await getUserByUsername(username);
  return ok(200, {
    data: updatedUser,
    user: updatedUser,
  });
}

export const handler = async (event) => {
  try {
    if (!USER_POOL_ID) {
      return err(500, 'COGNITO_USER_POOL_ID is not configured');
    }

    const claims = await getClaims(event);
    const method = event.httpMethod;
    const queryParams = event.queryStringParameters || {};
    const pathParams = event.pathParameters || {};
    const body = parseBody(event);

    if (body === null) {
      return err(400, 'Invalid request body');
    }

    if (method === 'GET' && isPath(event, '/users/me')) {
      return await getSelfProfile(claims);
    }

    if (method === 'GET' && isPath(event, '/users/check-email')) {
      return await checkEmailAvailability(queryParams);
    }

    if (method === 'POST' && isPath(event, '/users/init')) {
      return await initUserProfile(claims);
    }

    if (method === 'POST' && isPath(event, '/users/self-role')) {
      return await setSelfRole(claims, body);
    }

    if (!hasRole(claims.role, ['admin'])) {
      return err(403, 'Forbidden: Only admin can manage users');
    }

    if (method === 'GET' && isPath(event, '/users')) {
      return await listUsers(queryParams);
    }

    if (method === 'POST' && isPath(event, '/users')) {
      return await createUser(body);
    }

    if (method === 'PUT' && pathParams.username) {
      return await updateUser(decodeURIComponent(pathParams.username), body);
    }

    return err(405, 'Method not allowed');
  } catch (error) {
    console.error('userHandler error:', error);

    if (error?.name === 'UsernameExistsException') {
      return err(409, 'A user with this email/username already exists');
    }

    if (error?.name === 'UserNotFoundException') {
      return err(404, 'User not found');
    }

    if (error?.name === 'InvalidParameterException') {
      return err(400, error?.message || 'Invalid user input');
    }

    return err(500, 'Internal server error');
  }
};