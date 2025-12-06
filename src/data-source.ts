import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { InterviewCard } from "./entities/InterviewCard";
import { Application } from "./entities/Application";
import { Feedback } from "./entities/Feedback";
import { Subscription } from "./entities/Subscription";
import { Payment } from "./entities/Payment";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [User, InterviewCard, Application, Feedback, Subscription, Payment],
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  ssl: process.env.DATABASE_URL?.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : false,
});

