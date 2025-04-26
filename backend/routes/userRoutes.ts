import { Router } from 'express';
import * as userController from '../controllers/userController';

const userRoutes = Router();

userRoutes.get('/', userController.getAllUsers);
userRoutes.get('/:name', userController.getUserByName);
userRoutes.put('/:name', userController.updateUserByName);

export default userRoutes;