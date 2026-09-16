import { ROLES, type RoleValue } from 'src/constants/roles';

/** หน้าเช็คอินเข้าห้องสอบ — ไม่รวมผู้ดูแลระบบ */
export const ROOM_CHECK_IN_ROLES: RoleValue[] = [
  ROLES.STAFF,
  ROLES.REGISTRATION_OFFICER,
  ROLES.EXAM_OPERATIONS_OFFICER,
  ROLES.PROCTOR,
];

export const ROOM_CHECK_IN_ROUTE_NAMES = [
  'admin-check-in-rooms',
  'admin-room-check-in-scanner',
] as const;

export const isRoomCheckInRoute = (
  name: string | symbol | null | undefined,
): boolean =>
  typeof name === 'string' &&
  (ROOM_CHECK_IN_ROUTE_NAMES as readonly string[]).includes(name);

export const canAccessRoomCheckInPage = (
  role: string | null | undefined,
): boolean => role != null && ROOM_CHECK_IN_ROLES.includes(role as RoleValue);
