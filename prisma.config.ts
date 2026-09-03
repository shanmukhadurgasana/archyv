import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("postgresql://neondb_owner:npg_2gN4sLHwnSim@ep-late-flower-a5eawtqv-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"),
  },
});
