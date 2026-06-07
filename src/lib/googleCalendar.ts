import { google } from "googleapis";
import prisma from "./prisma";

export async function bookAppointment(clientId: string, patientName: string, patientPhone: string, date: string, time: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client || !client.googleRefreshToken) {
    throw new Error("Client has not connected their Google Calendar.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`
  );

  oauth2Client.setCredentials({
    refresh_token: client.googleRefreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Parse the date and time (e.g. "2026-06-08" and "14:00")
  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour appointment

  const event = {
    summary: `Patient Booking: ${patientName}`,
    description: `Phone: ${patientPhone}\nBooked via AI Clinic SaaS.`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: "UTC", // For simplicity, we use UTC or they can configure this later
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: "UTC",
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });
    
    return { success: true, link: response.data.htmlLink };
  } catch (error: any) {
    console.error("Error booking calendar:", error);
    return { success: false, error: error.message };
  }
}
