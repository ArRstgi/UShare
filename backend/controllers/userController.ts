import { Request, Response, NextFunction } from "express";
import userModel from "../models/userModel";
import { User } from "../types/chatTypes"; // Import User type

// Define expected Request param types for clarity
interface UserParams {
  name: string;
}

// Define expected Request body type for update
type UserUpdateBody = Partial<User>;

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await userModel.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error); // Pass error to the central handler
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
    const updatedUser = await userModel.updateUser(name, updateData);
    if (!updatedUser) {
      res.status(404).json({ message: `User '${name}' not found` });
      return; // Added return
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
    const user = await userModel.getUserByName(name);
    if (!user) {
      res.status(404).json({ message: `User '${name}' not found` });
      return; // Added return
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
