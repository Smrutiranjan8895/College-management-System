import { ok, err } from '../utils/response.js';
import { getClaims, hasRole } from '../utils/verifyToken.js';
import { DUMMY_DATASET, forceSeedDummyAcademicData } from '../utils/dummyData.js';

export const handler = async (event) => {
  try {
    const claims = await getClaims(event);
    const { role, userId } = claims;

    if (!hasRole(role, ['admin', 'branch_admin'])) {
      return err(403, 'Forbidden: Only admin or branch_admin can seed dummy data');
    }

    const method = event.httpMethod;
    if (method === 'GET') {
      return ok(200, {
        message: 'Dummy dataset preview',
        data: DUMMY_DATASET,
      });
    }

    if (method === 'POST') {
      const result = await forceSeedDummyAcademicData(userId || 'manual-seed');
      return ok(200, {
        message: 'Dummy academic data seeded successfully',
        ...result,
      });
    }

    return err(405, 'Method not allowed');
  } catch (error) {
    console.error('Error in seedDataHandler:', error);
    return err(500, 'Internal server error');
  }
};
