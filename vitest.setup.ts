process.env.NODE_ENV = "test";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
console.log("setup File");
// (global.console as any).log = vi.fn();
