import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs-extra'; // Use fs-extra
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express'; // Import Request type

// Path relative to THIS file (src/middleware/uploadMiddleware.ts)
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
try {
    fs.ensureDirSync(UPLOADS_DIR); // Synchronous version acceptable at setup
} catch (error) {
    console.error("Could not create uploads directory:", error);
    process.exit(1); // Exit if uploads directory cannot be created
}

const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const uniqueSuffix = uuidv4();
        const extension = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${extension}`);
    }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', '...'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // Accept
    } else {
        cb(new Error('File type not allowed!')); // Reject
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB limit
    }
});

export default upload; // Export the configured multer instance