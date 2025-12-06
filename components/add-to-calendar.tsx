"use client";

import { useState, useRef, useEffect } from "react";
import { generateGoogleCalendarLink, downloadICSFile } from "@/lib/calendar";

interface AddToCalendarProps {
    title: string;
    description?: string;
    location?: string;
    startDate: Date | string;
    endDate?: Date | string;
}

export function AddToCalendar({
    title,
    description,
    location,
    startDate,
    endDate,
}: AddToCalendarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleGoogleClick = () => {
        const link = generateGoogleCalendarLink({
            title,
            description,
            location,
            startTime: startDate,
            endTime: endDate,
        });
        window.open(link, "_blank");
        setIsOpen(false);
    };

    const handleICSClick = () => {
        downloadICSFile(
            {
                title,
                description,
                location,
                startTime: startDate,
                endTime: endDate,
            },
            "interview.ics"
        );
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
                <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
                Добавить в календарь
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-white/10 shadow-xl z-50 overflow-hidden">
                    <button
                        onClick={handleGoogleClick}
                        className="block w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        Google Calendar
                    </button>
                    <button
                        onClick={handleICSClick}
                        className="block w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors border-t border-white/5"
                    >
                        Apple / Outlook (.ics)
                    </button>
                </div>
            )}
        </div>
    );
}
