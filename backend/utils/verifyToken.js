// Token verification and claims extraction utility
// Extracts user info from Cognito JWT via API Gateway authorizer

import {
  AdminGetUserCommand,
  AdminListGroupsForUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || process.env.DYNAMODB_REGION || 'ap-south-1',
});

const claimsCache = new Map();
const CLAIMS_CACHE_TTL_MS = 5 * 60 * 1000;
const ALLOWED_ROLES = ['admin', 'branch_admin', 'teacher', 'student'];

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

function normalizeRole(value, fallback = 'student') {
  const raw = (value || '').toString().trim().toLowerCase();
  if (!raw) {
    return fallback;
  }

  const underscored = raw.replace(/[\s-]+/g, '_');
  return ROLE_ALIAS_MAP[underscored] || ROLE_ALIAS_MAP[raw] || fallback;
}

function normalizeBranch(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return String(value).trim().toUpperCase();
}

function getAuthorizationHeader(event) {
  const headers = event?.headers || {};
  const multiValueHeaders = event?.multiValueHeaders || {};

  return (
    headers.Authorization ||
    headers.authorization ||
    multiValueHeaders.Authorization?.[0] ||
    multiValueHeaders.authorization?.[0] ||
    null
  );
}

function getBearerToken(authorizationHeader) {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return null;
  }

  const match = authorizationHeader.trim().match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

function decodeJwtPayload(token) {
  if (!token) {
    return null;
  }

  const tokenParts = token.split('.');
  if (tokenParts.length < 2) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(tokenParts[1], 'base64url').toString('utf8');
    return JSON.parse(payloadJson);
  } catch (error) {
    console.warn('verifyToken: failed to decode JWT payload from Authorization header', {
      error: error?.name || error?.message,
    });
    return null;
  }
}

function readAttributeMap(attributes = []) {
  const map = {};
  for (const attr of attributes) {
    if (!attr?.Name) continue;
    map[attr.Name] = attr.Value;
  }
  return map;
}

function extractRoleFromGroups(groups = []) {
  for (const group of groups) {
    const normalizedRole = normalizeRole(group, '');
    if (ALLOWED_ROLES.includes(normalizedRole)) {
      return normalizedRole;
    }
  }
  return null;
}

async function fetchCognitoFallbackClaims(username) {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;

  if (!userPoolId || !username) {
    return {};
  }

  const cacheKey = `${userPoolId}:${username}`;
  const cached = claimsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const response = await cognitoClient.send(
      new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: username,
      })
    );

    let groups = [];
    try {
      const groupsResponse = await cognitoClient.send(
        new AdminListGroupsForUserCommand({
          UserPoolId: userPoolId,
          Username: username,
        })
      );

      groups = (groupsResponse.Groups || [])
        .map((group) => String(group?.GroupName || '').trim().toLowerCase())
        .filter(Boolean);
    } catch (groupError) {
      console.warn('verifyToken: AdminListGroupsForUser fallback failed', {
        username,
        error: groupError?.name || groupError?.message,
      });
    }

    const attrMap = readAttributeMap(response.UserAttributes);
    const roleFromGroups = extractRoleFromGroups(groups);
    const fallback = {
      email: attrMap.email || null,
      name: attrMap.name || null,
      role: normalizeRole(attrMap['custom:role'] || roleFromGroups, null),
      branch: normalizeBranch(attrMap['custom:branch'] || attrMap['custom:department'] || null),
      groups,
    };

    claimsCache.set(cacheKey, {
      expiresAt: Date.now() + CLAIMS_CACHE_TTL_MS,
      value: fallback,
    });

    return fallback;
  } catch (error) {
    console.warn('verifyToken: AdminGetUser fallback failed', {
      username,
      error: error?.name || error?.message,
    });
    return {};
  }
}

/**
 * Extract user claims from API Gateway authorizer context
 * @param {object} event - Lambda event from API Gateway
 * @returns {object} User claims object
 */
export const getClaims = async (event) => {
  const authorizerClaims =
    event.requestContext?.authorizer?.claims ||
    event.requestContext?.authorizer?.jwt?.claims ||
    {};
  const authorizationHeader = getAuthorizationHeader(event);
  const bearerToken = getBearerToken(authorizationHeader);
  const tokenPayload = decodeJwtPayload(bearerToken) || {};

  const claims = Object.keys(authorizerClaims).length > 0 ? authorizerClaims : tokenPayload;

  console.log('verifyToken: getClaims invoked', {
    method: event?.httpMethod || null,
    path: event?.path || null,
    hasAuthorizerClaims: Object.keys(authorizerClaims).length > 0,
    hasAuthorizationHeader: Boolean(authorizationHeader),
    hasBearerToken: Boolean(bearerToken),
    usingTokenPayloadFallback: Object.keys(authorizerClaims).length === 0 && Object.keys(tokenPayload).length > 0,
  });

  console.log('verifyToken: JWT payload snapshot', {
    sub: claims?.sub || null,
    email: claims?.email || null,
    username: claims?.['cognito:username'] || claims?.username || null,
  });

  const rawGroups = claims['cognito:groups'];

  const groups = Array.isArray(rawGroups)
    ? rawGroups
    : typeof rawGroups === 'string' && rawGroups.length > 0
      ? rawGroups.split(',')
      : [];

  const normalizedGroups = groups
    .map((group) => String(group).trim().toLowerCase())
    .filter(Boolean);

  const roleFromGroups = extractRoleFromGroups(normalizedGroups);
  const roleFromClaims = normalizeRole(claims['custom:role'], '');
  const branchFromClaims = claims['custom:branch'] || claims['custom:department'] || claims.branch || null;
  const username = claims['cognito:username'] || claims.username || claims.sub || null;

  const needsFallback = !roleFromClaims || !branchFromClaims || !claims.email || !claims.name;
  const fallbackClaims = needsFallback ? await fetchCognitoFallbackClaims(username) : {};

  const mergedGroups = [
    ...new Set([
      ...normalizedGroups,
      ...((fallbackClaims.groups || []).map((group) => String(group).trim().toLowerCase()).filter(Boolean)),
    ]),
  ];

  const role = normalizeRole(roleFromClaims || roleFromGroups || fallbackClaims.role || 'student');
  const roleAssigned = Boolean(roleFromClaims || roleFromGroups || fallbackClaims.role);
  const branch = normalizeBranch(branchFromClaims || fallbackClaims.branch || null);

  const resolvedClaims = {
    userId: claims.sub || null,
    username,
    email: claims.email || fallbackClaims.email || null,
    name: claims.name || fallbackClaims.name || null,
    role,
    roleAssigned,
    branch,
    groups: mergedGroups,
  };

  return resolvedClaims;
};

/**
 * Check if user has one of the allowed roles
 * @param {string} userRole - User's role from claims
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {boolean} True if user has permission
 */
export const hasRole = (userRole, allowedRoles) => {
  const normalizedRole = normalizeRole(userRole, '');
  return allowedRoles.includes(normalizedRole);
};

/**
 * Check if user can access data for a specific branch
 * Admin can access all branches, others only their own
 * @param {string} userRole - User's role
 * @param {string} userBranch - User's branch
 * @param {string} targetBranch - Branch being accessed
 * @returns {boolean} True if user can access the branch
 */
export const canAccessBranch = (userRole, userBranch, targetBranch) => {
  const normalizedRole = normalizeRole(userRole, '');
  const normalizedUserBranch = normalizeBranch(userBranch) || '';
  const normalizedTargetBranch = normalizeBranch(targetBranch) || '';

  if (normalizedRole === 'admin') return true;
  if (!normalizedTargetBranch) return true;
  if (!normalizedUserBranch) return true;
  return normalizedUserBranch === normalizedTargetBranch;
};
