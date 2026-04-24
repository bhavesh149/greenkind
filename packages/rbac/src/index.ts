export const Role = {
  PUBLIC: 'PUBLIC',
  SUBSCRIBER: 'SUBSCRIBER',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Permission = {
  SCORES_WRITE: 'scores.write',
  CHARITY_SELECT: 'charity.select',
  WINNER_UPLOAD_PROOF: 'winner.uploadProof',
  ADMIN_USERS: 'admin.users',
  ADMIN_DRAWS: 'admin.draws',
  ADMIN_CHARITIES: 'admin.charities',
  ADMIN_WINNERS: 'admin.winners',
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

const permissionsByKey: Record<Permission, readonly Role[]> = {
  [Permission.SCORES_WRITE]: [Role.SUBSCRIBER, Role.ADMIN],
  [Permission.CHARITY_SELECT]: [Role.SUBSCRIBER, Role.ADMIN],
  [Permission.WINNER_UPLOAD_PROOF]: [Role.SUBSCRIBER, Role.ADMIN],
  [Permission.ADMIN_USERS]: [Role.ADMIN],
  [Permission.ADMIN_DRAWS]: [Role.ADMIN],
  [Permission.ADMIN_CHARITIES]: [Role.ADMIN],
  [Permission.ADMIN_WINNERS]: [Role.ADMIN],
} as const;

export function can(role: Role, permission: Permission): boolean {
  return (permissionsByKey[permission] as readonly Role[]).includes(role);
}

export function isAdmin(role: Role): boolean {
  return role === Role.ADMIN;
}
