export const MSK_OFFSET = 3; // UTC+3

export interface CalendarEvent {
    title: string;
    description?: string;
    location?: string;
    startTime: Date | string;
    endTime?: Date | string; // Defaults to 1 hour after start
}

/**
 * Formats a date string to YYYYMMDDTHHmmSS format required by ICS/Google
 * We treat the input date as if it is already in the correct time, 
 * but we need to adjust it to be UTC for the output if we don't use TZID,
 * OR we just format it and specify the timezone.
 * 
 * For simplicity and "Unified MSK" requirement, we will assume the input date 
 * represents the time in MSK, or we will force the output to be interpreted as MSK.
 */
function formatDate(date: Date): string {
    return date.toISOString().replace(/-|:|\.\d+/g, "");
}

/**
 * Generates a Google Calendar link
 */
export function generateGoogleCalendarLink(event: CalendarEvent): string {
    const start = new Date(event.startTime);
    const end = event.endTime
        ? new Date(event.endTime)
        : new Date(start.getTime() + 60 * 60 * 1000);

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: event.title,
        details: event.description || "",
        location: event.location || "",
        dates: `${formatDate(start)}/${formatDate(end)}`,
        ctz: "Europe/Moscow", // Force MSK timezone
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates ICS file content
 */
export function generateICSContent(event: CalendarEvent): string {
    const start = new Date(event.startTime);
    const end = event.endTime
        ? new Date(event.endTime)
        : new Date(start.getTime() + 60 * 60 * 1000);

    // Format date as YYYYMMDDTHHmmSS
    const formatDateICS = (d: Date) => {
        return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    // We need to be careful here. If we want to enforce MSK, we should probably
    // convert the time to UTC assuming the input IS MSK, or use TZID.
    // Using TZID is more robust for "local time" but requires VTIMEZONE definition often.
    // Simpler approach: The input `event.startTime` is likely a UTC timestamp from the DB.
    // If the user wants "Unified MSK", it means "Show this time as if it's MSK" OR "This time IS MSK".
    // Usually, DB stores real UTC. 
    // If I schedule for 10:00 UTC, it is 13:00 MSK.
    // If the requirement is "Unified MSK", it implies we want to ensure the calendar event appears at the correct time in MSK.
    // If I pass the UTC timestamp to Google/Apple, they handle it.
    // So we just need to pass the correct UTC time.

    const now = new Date();

    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//SuperMock2//Interview Calendar//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `UID:${start.getTime()}@supermock2.com`,
        `DTSTAMP:${formatDateICS(now)}`,
        `DTSTART:${formatDateICS(start)}`,
        `DTEND:${formatDateICS(end)}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description || ""}`,
        `LOCATION:${event.location || ""}`,
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");
}

/**
 * Triggers a download of the ICS file
 */
export function downloadICSFile(event: CalendarEvent, filename: string = "interview.ics") {
    const content = generateICSContent(event);
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}
