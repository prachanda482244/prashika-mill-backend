import { config } from "dotenv";
config();
export const PORT = process.env.PORT;
export const MONGODB_URI = process.env.MONGODB_URI;
export const DB_NAME = "Prashika-Mel";
export const cookieOptions = {
  // httpOnly: true,
  // secure: true,
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
