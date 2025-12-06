#!/usr/bin/env tsx
/**
 * Миграция для добавления полей контактов в таблицу users
 * 
 * Добавляет колонки:
 * - telegram (varchar, nullable)
 * - discord (varchar, nullable)  
 * - whatsapp (varchar, nullable)
 * 
 * Запуск: npx tsx scripts/add-contact-fields-migration.ts
 */

import "reflect-metadata";
import { initDB } from "@/lib/db";

async function runMigration() {
    console.log("Запуск миграции: добавление полей контактов...");

    try {
        const dataSource = await initDB();

        // Проверяем, существуют ли уже колонки
        const queryRunner = dataSource.createQueryRunner();

        await queryRunner.connect();

        // Получаем информацию о таблице
        const table = await queryRunner.getTable("users");

        if (!table) {
            throw new Error("Таблица users не найдена");
        }

        // Проверяем наличие колонок
        const hasTelegram = table.columns.some(col => col.name === "telegram");
        const hasDiscord = table.columns.some(col => col.name === "discord");
        const hasWhatsApp = table.columns.some(col => col.name === "whatsapp");

        // Добавляем колонки, если их нет
        if (!hasTelegram) {
            console.log("Добавление колонки telegram...");
            await queryRunner.query(
                `ALTER TABLE "users" ADD COLUMN "telegram" VARCHAR NULL`
            );
            console.log("✓ Колонка telegram добавлена");
        } else {
            console.log("○ Колонка telegram уже существует");
        }

        if (!hasDiscord) {
            console.log("Добавление колонки discord...");
            await queryRunner.query(
                `ALTER TABLE "users" ADD COLUMN "discord" VARCHAR NULL`
            );
            console.log("✓ Колонка discord добавлена");
        } else {
            console.log("○ Колонка discord уже существует");
        }

        if (!hasWhatsApp) {
            console.log("Добавление колонки whatsapp...");
            await queryRunner.query(
                `ALTER TABLE "users" ADD COLUMN "whatsapp" VARCHAR NULL`
            );
            console.log("✓ Колонка whatsapp добавлена");
        } else {
            console.log("○ Колонка whatsapp уже существует");
        }

        await queryRunner.release();

        console.log("\n✅ Миграция успешно выполнена!");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Ошибка при выполнении миграции:", error);
        process.exit(1);
    }
}

runMigration();
