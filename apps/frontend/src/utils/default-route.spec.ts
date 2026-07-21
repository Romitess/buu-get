import { describe, expect, it } from 'vitest';
import { ROLES } from 'src/constants/roles';
import { getDefaultRouteForRole } from 'src/utils/default-route';

describe('getDefaultRouteForRole', () => {
  it('routes candidates to exam schedule', () => {
    expect(getDefaultRouteForRole(ROLES.CANDIDATE)).toEqual({
      name: 'exam-schedule',
    });
  });

  it('routes finance staff to payment import', () => {
    expect(getDefaultRouteForRole(ROLES.FINANCE)).toEqual({
      name: 'admin-payment-import',
    });
  });

  it('routes admin staff to exam management', () => {
    expect(getDefaultRouteForRole(ROLES.ADMIN)).toEqual({
      name: 'admin-exam-management',
    });
  });
});
