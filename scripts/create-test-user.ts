import "reflect-metadata";
import { DataSource } from "typeorm";
import { User, UserRole } from "../src/entities/User";
import { InterviewCard } from "../src/entities/InterviewCard";
import { Application } from "../src/entities/Application";
import { Feedback } from "../src/entities/Feedback";
import { Subscription } from "../src/entities/Subscription";
import { Payment } from "../src/entities/Payment";
import * as bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

// Hardcode the connection string based on docker-compose.yml
const DATABASE_URL = "postgres://supermock:supermock_password@localhost:5434/supermock_db";

async function main() {
    const logFile = path.join(process.cwd(), "create-user-output.txt");
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + "\n");
    };

    // Clear log file
    fs.writeFileSync(logFile, "Starting script...\n");

    try {
        const dataSource = new DataSource({
            type: "postgres",
            url: DATABASE_URL,
            entities: [User, InterviewCard, Application, Feedback, Subscription, Payment],
            synchronize: true, // Sync to ensure tables exist if they don't
            logging: ["error", "info", "warn"],
        });

        log("Initializing DataSource...");
        await dataSource.initialize();
        log("DataSource initialized.");

        const userRepo = dataSource.getRepository(User);
        const email = "test@example.com";

        log(`Checking for user ${email}...`);
        const existing = await userRepo.findOne({ where: { email } });

        if (existing) {
            log(`User ${email} already exists.`);
        } else {
            log("Creating new user...");
            const hashedPassword = await bcrypt.hash("password123", 10);
            const user = userRepo.create({
                id: require("crypto").randomUUID(),
                name: "Test User",
                email: email,
                password: hashedPassword,
                role: UserRole.USER,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            await userRepo.save(user);
            log(`User ${email} created successfully.`);
        }

        await dataSource.destroy();
        log("Done.");
    } catch (err) {
        log("Error: " + err);
        if (err instanceof Error) {
            log(err.stack || "");
        }
    }
}

main();
