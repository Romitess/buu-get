import { RoleEnum } from 'src/modules/roles/enums/role.enum';

/**
 * อันดับบทบาทสำหรับกฎมอบหมาย: มอบระดับเดียวกันหรือต่ำกว่าได้ ห้ามสูงกว่า
 * (admin = 2 → มอบ admin ได้ แต่ห้าม super_admin)
 */
export const ROLE_RANK: Record<RoleEnum, number> = {
  [RoleEnum.CANDIDATE]: 0,
  [RoleEnum.STAFF]: 1,
  [RoleEnum.FINANCE]: 1,
  [RoleEnum.PROCTOR]: 1,
  [RoleEnum.EXECUTIVE]: 1,
  [RoleEnum.REGISTRATION_OFFICER]: 1,
  [RoleEnum.EXAM_OPERATIONS_OFFICER]: 1,
  [RoleEnum.ADMIN]: 2,
  [RoleEnum.SUPER_ADMIN]: 3,
};

const ROLE_RANK_BY_NAME = new Map<string, number>(
  Object.entries(ROLE_RANK).map(([name, rank]) => [name.toLowerCase(), rank]),
);

/** อันดับของชื่อ role; ไม่รู้จักใน enum → สูงสุด (ห้ามมอบ) */
export function getRoleRank(roleName: string): number {
  return (
    ROLE_RANK_BY_NAME.get(roleName.toLowerCase()) ?? Number.POSITIVE_INFINITY
  );
}

export function maxRoleRank(roleNames: Iterable<string>): number {
  let max = 0;
  for (const name of roleNames) {
    max = Math.max(max, getRoleRank(name));
  }
  return max;
}
