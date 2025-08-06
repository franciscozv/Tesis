import { Router } from 'express';
import { PeopleOnGroupsController } from './peopleOnGroupsController';
import { PeopleOnGroupsService } from './peopleOnGroupsService';
import { PeopleOnGroupsRepository } from './peopleOnGroupsRepository';

const router: Router = Router();
const repository = new PeopleOnGroupsRepository();
const service = new PeopleOnGroupsService(repository);
const controller = new PeopleOnGroupsController(service);

router.post('/', (req, res) => controller.addPersonToGroup(req, res));
router.get('/:groupId', (req, res) => controller.getPeopleInGroup(req, res));
router.delete('/:groupId/:personId', (req, res) => controller.removePersonFromGroup(req, res));
router.put('/:groupId/:personId', (req, res) => controller.updatePersonInGroup(req, res));

export default router;