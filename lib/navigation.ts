import { getNavSections } from './modules';

export { getNavSections, MODULES, MODULE_MAP, getModuleByHref, getModuleByKey } from './modules';
export type { ModuleDef, NavSection } from './modules';

export const navSections = getNavSections();
