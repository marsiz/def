export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface ModulePermission {
  module_key: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export type PermissionMap = Record<string, ModulePermission>;

export function hasPermission(
  permissions: PermissionMap | null,
  role: 'admin' | 'user' | undefined | null,
  moduleKey: string,
  action: PermissionAction = 'view'
): boolean {
  if (role === 'admin') return true;
  if (!permissions) return false;
  const perm = permissions[moduleKey];
  if (!perm) return false;
  switch (action) {
    case 'view': return perm.can_view;
    case 'create': return perm.can_create;
    case 'edit': return perm.can_edit;
    case 'delete': return perm.can_delete;
    default: return false;
  }
}
