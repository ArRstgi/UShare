import express from "express";

import taskRoutes from "../routes/taskRoutes";
import userRoutes from "../routes/userRoutes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/user", userRoutes);
app.use("/task", taskRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});