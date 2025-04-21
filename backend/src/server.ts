import express from "express";
import profileRoutes from "../routes/profileRoutes";
import path from "path";
import multer from "multer";
import cors from "cors";

const app = express();

// upload folder on disk
const upload = multer({
  dest: path.join(__dirname, "../uploads/"),
});

// serve that folder publicly
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


// Allow port 3000 (backend) and 5173 (frontend) to share resources for compatibility
// Cors is a middleware and it stands for Cross‑Origin Resource Sharing
app.use(cors({ origin: "http://localhost:5173" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/profile", profileRoutes);  

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
