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
    const logFile = path.join(process.cwd(), "create-admin-output.txt");
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + "\n");
    };

    // Получаем параметры из командной строки или используем значения по умолчанию
    const email = process.argv[2] || "admin@example.com";
    const password = process.argv[3] || "admin123";
    const name = process.argv[4] || "Admin User";

    // Clear log file
    fs.writeFileSync(logFile, `Starting admin user creation script...\nEmail: ${email}\n`);

    try {
        const dataSource = new DataSource({
            type: "postgres",
            url: DATABASE_URL,
            entities: [User, InterviewCard, Application, Feedback, Subscription, Payment],
            synchronize: false, // Не используем synchronize в продакшене
            logging: ["error", "info", "warn"],
        });

        log("Initializing DataSource...");
        await dataSource.initialize();
        log("DataSource initialized.");

        const userRepo = dataSource.getRepository(User);

        log(`Checking for user ${email}...`);
        const existing = await userRepo.findOne({ where: { email } });

        if (existing) {
            log(`User ${email} already exists. Updating role to ADMIN...`);
            existing.role = UserRole.ADMIN;
            // Обновляем пароль, если он был передан
            if (process.argv[3]) {
                existing.password = await bcrypt.hash(password, 10);
                log("Password updated.");
            }
            await userRepo.save(existing);
            log(`User ${email} updated to ADMIN role successfully.`);
        } else {
            log("Creating new admin user...");
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = userRepo.create({
                id: require("crypto").randomUUID(),
                name: name,
                email: email,
                password: hashedPassword,
                role: UserRole.ADMIN,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            await userRepo.save(user);
            log(`Admin user ${email} created successfully.`);
            log(`Password: ${password}`);
        }

        await dataSource.destroy();
        log("Done.");
    } catch (err) {
        log("Error: " + err);
        if (err instanceof Error) {
            log(err.stack || "");
        }
        process.exit(1);
    }
}

main();

