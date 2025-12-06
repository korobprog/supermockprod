import "reflect-metadata";
import { DataSource, Repository } from "typeorm";
import { User } from "@/src/entities/User";
import { InterviewCard } from "@/src/entities/InterviewCard";
import { Application } from "@/src/entities/Application";
import { Feedback } from "@/src/entities/Feedback";
import { Subscription } from "@/src/entities/Subscription";
import { Payment } from "@/src/entities/Payment";

const globalForTypeORM = globalThis as unknown as {
  dataSource: DataSource | undefined;
  isInitializing: boolean;
};

function createDataSource(): DataSource {
  const entities = [User, InterviewCard, Application, Feedback, Subscription, Payment];
  console.log("Entities passed to DataSource:", entities);
  return new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: entities,
    synchronize: process.env.NODE_ENV !== "production",
    logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ssl: process.env.DATABASE_URL?.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : false,
  });
}

// Get or create the DataSource
function getDataSource(): DataSource {
  if (!globalForTypeORM.dataSource) {
    globalForTypeORM.dataSource = createDataSource();
  }
  return globalForTypeORM.dataSource;
}

const dataSource = getDataSource();

// Initialize synchronously for the module, but allow async for await
let initPromise: Promise<DataSource> | null = null;

function ensureInitialized(): DataSource {
  if (dataSource.isInitialized) {
    return dataSource;
  }

  // Start initialization if not already started
  if (!initPromise && !globalForTypeORM.isInitializing) {
    globalForTypeORM.isInitializing = true;
    initPromise = dataSource.initialize()
      .then(() => {
        console.log("Database initialized successfully");
        globalForTypeORM.isInitializing = false;
        return dataSource;
      })
      .catch((err) => {
        console.error("Error initializing database:", err);
        globalForTypeORM.isInitializing = false;
        throw err;
      });
  }

  return dataSource;
}

// Async init that can be awaited
export async function initDB(): Promise<DataSource> {
  if (dataSource.isInitialized) {
    return dataSource;
  }

  if (!initPromise) {
    globalForTypeORM.isInitializing = true;
    initPromise = dataSource.initialize()
      .then(() => {
        console.log("Database initialized successfully");
        globalForTypeORM.isInitializing = false;
        return dataSource;
      })
      .catch((err) => {
        console.error("Error initializing database:", err);
        globalForTypeORM.isInitializing = false;
        initPromise = null;
        throw err;
      });
  }

  return initPromise;
}

// Start initialization eagerly
ensureInitialized();

// Helper function to get repository by entity class or table name
// This handles minification issues in production builds
import { ObjectLiteral } from "typeorm";

function getRepositorySafe<T extends ObjectLiteral>(entityClass: any, tableName: string): Repository<T> {
  try {
    // Try to get by class first (works in dev)
    return dataSource.getRepository(entityClass);
  } catch (error) {
    // Fallback to table name (works in production with minified code)
    return dataSource.getRepository(tableName) as Repository<T>;
  }
}

// Sync repository getters (for backwards compatibility)
// These rely on the fact that by the time a server component runs,
// the database should be initialized
export async function userRepository(): Promise<Repository<User>> {
  await initDB();
  return getRepositorySafe<User>(User, "users");
}

export async function interviewCardRepository(): Promise<Repository<InterviewCard>> {
  await initDB();
  return getRepositorySafe<InterviewCard>(InterviewCard, "interview_cards");
}

export async function applicationRepository(): Promise<Repository<Application>> {
  await initDB();
  return getRepositorySafe<Application>(Application, "applications");
}

export async function feedbackRepository(): Promise<Repository<Feedback>> {
  await initDB();
  return getRepositorySafe<Feedback>(Feedback, "feedbacks");
}

export async function subscriptionRepository(): Promise<Repository<Subscription>> {
  await initDB();
  return getRepositorySafe<Subscription>(Subscription, "subscriptions");
}

export async function paymentRepository(): Promise<Repository<Payment>> {
  await initDB();
  return getRepositorySafe<Payment>(Payment, "payments");
}

// Export entities
export { User, InterviewCard, Application, Feedback, Subscription, Payment };
export { UserRole } from "@/src/entities/User";
export { CardStatus } from "@/src/entities/InterviewCard";
export { ApplicationStatus } from "@/src/entities/Application";
export { SubscriptionStatus } from "@/src/entities/Subscription";
export { PaymentStatus } from "@/src/entities/Payment";
