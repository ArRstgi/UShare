// backend/controllers/userController.ts
import { Request, Response, NextFunction } from "express";
import userModel from "../models/userModel";
import { User } from "../types/chatTypes"; // Import User type for response consistency

interface UserParams {
  name: string;
}

type UserUpdateBody = Partial<User>; // Frontend sends partial User data

export const getAllUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // userModel.getAllUsers returns User[] directly matching the type
    const users = await userModel.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

export const updateUserByName = async (
  req: Request<UserParams, {}, UserUpdateBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { name } = req.params;
  const updateData = req.body;

  if (!updateData || Object.keys(updateData).length === 0) {
    res.status(400).json({ message: "No update data provided." });
    return;
  }
  try {
    // userModel.updateUser returns the updated User object or null
    const updatedUser = await userModel.updateUser(name, updateData);
    if (!updatedUser) {
      res
        .status(404)
        .json({ message: `User '${name}' not found or no changes made` });
      return;
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const getUserByName = async (
  req: Request<UserParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { name } = req.params;
  try {
    // userModel.getUserByName returns User or null
    const user = await userModel.getUserByName(name);
    if (!user) {
      res.status(404).json({ message: `User '${name}' not found` });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
