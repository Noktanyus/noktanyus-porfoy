/**
 * Admin Module — Barrel Export
 */
export * as adminService from './service';
export { testimonialRepository, TestimonialRepository } from './repository';
export { auditRepository, AuditRepository, auditService } from './audit';
export { workspaceRepository, WorkspaceRepository } from './workspaceRepository';
export { workspaceService } from './workspaceService';
