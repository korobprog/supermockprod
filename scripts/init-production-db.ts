#!/usr/bin/env tsx
/**
 * Скрипт для инициализации базы данных в production
 * Создает все необходимые таблицы через synchronize
 * 
 * Запуск: npx tsx scripts/init-production-db.ts
 */

import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "@/src/entities/User";
import { InterviewCard } from "@/src/entities/InterviewCard";
import { Application } from "@/src/entities/Application";
import { Feedback } from "@/src/entities/Feedback";
import { Subscription } from "@/src/entities/Subscription";
import { Payment } from "@/src/entities/Payment";

async function initProductionDB() {
    console.log("Инициализация базы данных для production...");
    console.log("⚠️  ВНИМАНИЕ: Этот скрипт использует synchronize для создания таблиц.");
    console.log("⚠️  Используйте только для первого запуска или если таблицы отсутствуют.\n");

    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL не установлен!");
        process.exit(1);
    }

    try {
        const dataSource = new DataSource({
            type: "postgres",
            url: process.env.DATABASE_URL,
            entities: [User, InterviewCard, Application, Feedback, Subscription, Payment],
            synchronize: true, // Временно включаем для создания таблиц
            logging: ["error", "warn", "schema"],
            ssl: process.env.DATABASE_URL?.includes("sslmode=require")
                ? { rejectUnauthorized: false }
                : false,
        });

        await dataSource.initialize();
        console.log("✓ Подключение к базе данных установлено");
        console.log("✓ Таблицы созданы/обновлены");
        
        await dataSource.destroy();
        console.log("\n✅ База данных готова к использованию!");
        
    } catch (error) {
        console.error("❌ Ошибка при инициализации базы данных:", error);
        process.exit(1);
    }
}

initProductionDB();

