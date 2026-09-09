import multer from "multer";

const ALLOWED_EXTENSIONS = new Set(["csv", "xlsx", "xls"]);

export const spreadsheetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const extension = file.originalname.split(".").pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
      return cb(new Error("Only .csv, .xlsx, or .xls files are allowed."));
    }
    cb(null, true);
  },
});
