import { useState, useEffect } from 'react';
import { getCurrentUser, fetchAuthSession, fetchUserAttributes, signOut as amplifySignOut } from 'aws-amplify/auth';

const STALE_SESSION_ERROR_NAMES = new Set([
  'UserUnAuthenticatedException',
  'NotAuthorizedException',
  'AuthTokenConfigException',
]);

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim();

const ROLE_ALIAS_MAP = {
  admin: 'admin',
  admins: 'admin',
  branch_admin: 'branch_admin',
  'branch-admin': 'branch_admin',
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

async function fetchServerUserProfile(authToken) {
  if (!API_BASE_URL || !authToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return payload?.data || payload?.user || null;
  } catch (error) {
    console.warn('Could not fetch server user profile:', error);
    return null;
  }
}

async function syncPendingRole(authToken, pendingRole, pendingBranch) {
  if (!API_BASE_URL || !authToken || !pendingRole) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/self-role`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: pendingRole,
        branch: pendingBranch,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return payload?.data || payload?.user || null;
  } catch (error) {
    console.warn('Could not sync pending role:', error);
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const currentUser = await getCurrentUser();
      let attributes = {};
      let tokenClaims = {};
      let authToken = null;

      try {
        const session = await fetchAuthSession();
        tokenClaims = session.tokens?.idToken?.payload || {};
        authToken = session.tokens?.idToken?.toString() || session.tokens?.accessToken?.toString() || null;
      } catch (sessionError) {
        console.warn('Could not fetch auth session payload:', sessionError);
      }

      try {
        attributes = await fetchUserAttributes();
      } catch (attributeError) {
        // If local/session tokens are stale, clear cached auth state and treat as signed out.
        if (STALE_SESSION_ERROR_NAMES.has(attributeError?.name)) {
          try {
            await amplifySignOut();
          } catch {
            // Ignore cleanup failures and continue with signed-out state.
          }
          throw attributeError;
        }

        // Non-auth failures (for example transient network issues) should not drop a valid session.
        console.warn('Could not fetch user attributes, continuing with basic session data:', attributeError);
      }

      let serverProfile = await fetchServerUserProfile(authToken);

      const pendingRole = localStorage.getItem('pendingUserRole');
      const pendingBranch = localStorage.getItem('pendingUserBranch');

      if (pendingRole && authToken && (!serverProfile || !serverProfile.roleAssigned)) {
        const syncedProfile = await syncPendingRole(authToken, pendingRole, pendingBranch);
        if (syncedProfile) {
          serverProfile = syncedProfile;
        }
      }

      const email =
        serverProfile?.email ||
        attributes.email ||
        currentUser.signInDetails?.loginId ||
        currentUser.username;
      const displayName =
        serverProfile?.name ||
        attributes.name ||
        email?.split('@')[0] ||
        currentUser.username;
      
      setUser({
        userId: serverProfile?.userId || currentUser.userId,
        username: serverProfile?.username || currentUser.username,
        email,
        name: displayName,
      });

      const groupClaim = tokenClaims['cognito:groups'];
      const normalizedGroups = Array.isArray(groupClaim)
        ? groupClaim.map((group) => String(group).toLowerCase())
        : typeof groupClaim === 'string'
          ? groupClaim.split(',').map((group) => group.trim().toLowerCase())
          : [];

      const roleFromGroups = normalizedGroups.find((group) =>
        ['admin', 'branch_admin', 'teacher', 'student'].includes(normalizeRole(group, ''))
      );

      const userRole = normalizeRole(
        serverProfile?.role ||
        tokenClaims['custom:role'] ||
        roleFromGroups ||
        attributes['custom:role'] ||
        pendingRole ||
        'student'
      );

      const userBranch = (
        serverProfile?.branch ||
        tokenClaims['custom:branch'] ||
        attributes['custom:branch'] ||
        pendingBranch ||
        'CS'
      ).toString().toUpperCase();
      
      setRole(userRole);
      setBranch(userBranch);

      localStorage.removeItem('pendingUserRole');
      localStorage.removeItem('pendingUserBranch');
    } catch (error) {
      console.warn('Auth check failed:', error?.name || error?.message || error);
      setUser(null);
      setRole(null);
      setBranch(null);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    try {
      await amplifySignOut();
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setUser(null);
      setRole(null);
      setBranch(null);
      window.location.href = '/login';
    }
  }

  return { user, role, branch, signOut, loading, refetch: checkAuth };
}

export default useAuth;
