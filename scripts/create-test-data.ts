import "reflect-metadata";
import { DataSource } from "typeorm";
import { User, UserRole } from "../src/entities/User";
import { InterviewCard } from "../src/entities/InterviewCard";
import { Application } from "../src/entities/Application";
import { Feedback } from "../src/entities/Feedback";
import { Subscription } from "../src/entities/Subscription";
import { Payment, PaymentStatus } from "../src/entities/Payment";
import * as bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

// Hardcode the connection string based on docker-compose.yml
const DATABASE_URL = "postgres://supermock:supermock_password@localhost:5434/supermock_db";

interface TestUser {
    name: string;
    email: string;
    password: string;
    telegram?: string;
    discord?: string;
    whatsapp?: string;
    payments?: number[];
}

const testUsers: TestUser[] = [
    {
        name: "Иван Петров",
        email: "ivan@test.com",
        password: "test123",
        telegram: "@ivan_petrov",
        discord: "ivan_petrov#1234",
        whatsapp: "+79991234567",
        payments: [100, 200],
    },
    {
        name: "Мария Сидорова",
        email: "maria@test.com",
        password: "test123",
        telegram: "@maria_sidorova",
        payments: [150],
    },
    {
        name: "Алексей Иванов",
        email: "alex@test.com",
        password: "test123",
        discord: "alex_ivanov#5678",
        whatsapp: "+79997654321",
        payments: [300, 100],
    },
    {
        name: "Елена Козлова",
        email: "elena@test.com",
        password: "test123",
        telegram: "@elena_kozlova",
        discord: "elena_kozlova#9012",
        payments: [50],
    },
];

async function main() {
    const logFile = path.join(process.cwd(), "test-data-output.txt");
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + "\n");
    };

    // Clear log file
    fs.writeFileSync(logFile, "Starting test data creation script...\n");

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
        const paymentRepo = dataSource.getRepository(Payment);

        for (const testUser of testUsers) {
            log(`\n=== Processing user: ${testUser.email} ===`);

            // Проверяем, существует ли пользователь
            let user = await userRepo.findOne({ where: { email: testUser.email } });

            if (user) {
                log(`User ${testUser.email} already exists. Updating...`);
                user.name = testUser.name;
                user.telegram = testUser.telegram || null;
                user.discord = testUser.discord || null;
                user.whatsapp = testUser.whatsapp || null;
                // Обновляем пароль
                user.password = await bcrypt.hash(testUser.password, 10);
                await userRepo.save(user);
                log(`User ${testUser.email} updated.`);
            } else {
                log(`Creating new user: ${testUser.email}...`);
                const hashedPassword = await bcrypt.hash(testUser.password, 10);
                user = userRepo.create({
                    id: require("crypto").randomUUID(),
                    name: testUser.name,
                    email: testUser.email,
                    password: hashedPassword,
                    telegram: testUser.telegram || null,
                    discord: testUser.discord || null,
                    whatsapp: testUser.whatsapp || null,
                    role: UserRole.USER,
                    points: 0,
                    freeInterviewsUsed: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                await userRepo.save(user);
                log(`User ${testUser.email} created successfully.`);
            }

            // Создаем платежи для пользователя
            if (testUser.payments && testUser.payments.length > 0) {
                log(`Creating payments for ${testUser.email}...`);
                
                for (const amount of testUser.payments) {
                    // Проверяем, не существует ли уже такой платеж
                    const existingPayment = await paymentRepo.findOne({
                        where: {
                            userId: user.id,
                            amount: amount,
                            status: PaymentStatus.PENDING,
                        },
                    });

                    if (!existingPayment) {
                        const payment = paymentRepo.create({
                            id: require("crypto").randomUUID(),
                            userId: user.id,
                            amount: amount,
                            status: PaymentStatus.PENDING,
                            adminNote: null,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                        await paymentRepo.save(payment);
                        log(`  ✓ Created payment: ${amount} баллов (ID: ${payment.id})`);
                    } else {
                        log(`  - Payment ${amount} баллов already exists for this user.`);
                    }
                }
            }
        }

        // Выводим статистику
        log("\n=== Statistics ===");
        const totalUsers = await userRepo.count();
        const totalPayments = await paymentRepo.count();
        const pendingPayments = await paymentRepo.count({
            where: { status: PaymentStatus.PENDING },
        });
        
        log(`Total users: ${totalUsers}`);
        log(`Total payments: ${totalPayments}`);
        log(`Pending payments: ${pendingPayments}`);

        await dataSource.destroy();
        log("\nDone. Test data created successfully!");
        log("\nTest users credentials:");
        log("Email: ivan@test.com, Password: test123");
        log("Email: maria@test.com, Password: test123");
        log("Email: alex@test.com, Password: test123");
        log("Email: elena@test.com, Password: test123");
    } catch (err) {
        log("Error: " + err);
        if (err instanceof Error) {
            log(err.stack || "");
        }
        process.exit(1);
    }
}

main();

