import { google } from "googleapis";
import prisma from "./prisma";

async function getCalendarClient(clientId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client || !client.googleRefreshToken) {
    throw new Error("Client has not connected their Google Calendar.");
  }
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`
  );
  oauth2Client.setCredentials({ refresh_token: client.googleRefreshToken });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function checkAvailability(clientId: string, date: string) {
  try {
    const calendar = await getCalendarClient(clientId);
    const timeMin = new Date(`${date}T00:00:00Z`).toISOString();
    const timeMax = new Date(`${date}T23:59:59Z`).toISOString();

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: "primary" }],
      },
    });

    const busySlots = response.data.calendars?.primary?.busy || [];
    return { success: true, date, busySlots };
  } catch (error: any) {
    console.error("Error checking availability:", error);
    return { success: false, error: error.message };
  }
}

export async function bookAppointment(clientId: string, patientName: string, patientPhone: string, date: string, time: string, durationMinutes: number = 60) {
  try {
    const calendar = await getCalendarClient(clientId);
    
    // Parse the date and time (e.g. "2026-06-08" and "14:00")
    const startDateTime = new Date(`${date}T${time}:00Z`); // Assuming UTC for now
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

    // 1. COLLISION CHECK: Explicitly query the exact timeslot to ensure it is free!
    const freeBusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDateTime.toISOString(),
        timeMax: endDateTime.toISOString(),
        items: [{ id: "primary" }],
      },
    });

    const busySlots = freeBusy.data.calendars?.primary?.busy || [];
    if (busySlots.length > 0) {
      return { 
        success: false, 
        error: "DOUBLE_BOOKING_PREVENTED",
        message: "That specific time slot was just taken by another patient. Please apologize and offer the patient a different time." 
      };
    }

    // 2. BOOK IT
    const event = {
      summary: `Patient Booking: ${patientName}`,
      description: `Phone: ${patientPhone}\nBooked via AI Clinic SaaS.`,
      start: { dateTime: startDateTime.toISOString(), timeZone: "UTC" },
      end: { dateTime: endDateTime.toISOString(), timeZone: "UTC" },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });
    
    return { success: true, link: response.data.htmlLink, message: "Appointment successfully booked." };
  } catch (error: any) {
    console.error("Error booking calendar:", error);
    return { success: false, error: error.message };
  }
}
