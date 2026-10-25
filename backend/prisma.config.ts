import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // Specify the path to your schema file (e.g., if you had "schema": "./src/db/schema.prisma")
  schema: "prisma/schema.prisma", 

  // Optional: If you use prisma migrate or a custom seeding script
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts", 
  },

  // Prisma 7 requires the datasource URL configuration inside the config file
  datasource: {
    url: env("DATABASE_URL"),
    directUrl: env("DIRECT_URL")
  },
});
