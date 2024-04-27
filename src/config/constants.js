import { config } from "dotenv";
config();
export const PORT = process.env.PORT;
export const MONGODB_URI = process.env.MONGODB_URI;
export const DB_NAME = "Prashika-Mel";
export const cookieOptions = {
  httpOnly: false,
  secure: false,
};
