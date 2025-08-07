
import express from 'express';
import { groupRoleAssignmentController } from './groupRoleAssignmentController';

const router = express.Router({ mergeParams: true });

router.get('/', groupRoleAssignmentController.getRolesForGroup);
router.post('/', groupRoleAssignmentController.assignRoleToGroup);
router.delete('/:roleId', groupRoleAssignmentController.removeRoleFromGroup);

export default router;
