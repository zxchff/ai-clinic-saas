import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
const prisma = new PrismaClient();

async function patchVapi() {
  const vapiKey = process.env.VAPI_PRIVATE_KEY;
  if (!vapiKey) return console.log("No VAPI_PRIVATE_KEY");

  // Get all clients that have a vapiPhoneNumber
  const clients = await prisma.client.findMany({
    where: { vapiPhoneNumber: { not: null } }
  });

  console.log(`Found ${clients.length} clients with phone numbers`);

  // Fetch all phone numbers from Vapi to get the assistantIds
  const phoneRes = await fetch("https://api.vapi.ai/phone-number", {
    headers: { "Authorization": `Bearer ${vapiKey}` }
  });
  
  const phoneNumbers = await phoneRes.json();
  console.log(`Found ${phoneNumbers.length} phone numbers in Vapi`);

  for (const client of clients) {
    const matchingPhone = phoneNumbers.find((p: any) => p.number === client.vapiPhoneNumber);
    if (!matchingPhone || !matchingPhone.assistantId) continue;

    console.log(`Updating Assistant ${matchingPhone.assistantId} for client ${client.name}...`);

    const updateRes = await fetch(`https://api.vapi.ai/assistant/${matchingPhone.assistantId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${vapiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: {
          provider: "openai",
          model: "gpt-4o",
          messages: [{ role: "system", content: `${client.phoneInstructions || client.rulebook || "You are a helpful receptionist."}\n\nCRITICAL SCHEDULING RULES:\n${client.schedulingRules || "You can book appointments at any valid business time."}\nYou MUST STRICTLY enforce these scheduling rules when using the book_appointment tool.` }],
          tools: [
            {
              type: "function",
              messages: [{ type: "request-start", content: "Let me check the calendar for you real quick." }],
              function: {
                name: "check_availability",
                description: "Queries the Google Calendar to find all busy/occupied time slots for a specific date.",
                parameters: {
                  type: "object",
                  properties: { date: { type: "string", description: "YYYY-MM-DD" } },
                  required: ["date"]
                }
              }
            },
            {
              type: "function",
              messages: [{ type: "request-start", content: "Give me one second while I get that booked for you." }],
              function: {
                name: "book_appointment",
                description: "Books an appointment on the clinic's Google Calendar. ONLY call this when the user has provided their name, phone number, and requested a specific date and time.",
                parameters: {
                  type: "object",
                  properties: {
                    date: { type: "string" },
                    time: { type: "string" },
                    durationMinutes: { type: "number" },
                    patientName: { type: "string" },
                    patientPhone: { type: "string" }
                  },
                  required: ["date", "time", "durationMinutes", "patientName", "patientPhone"]
                }
              }
            }
          ]
        }
      })
    });

    if (updateRes.ok) {
      console.log(`Success!`);
    } else {
      console.log(`Failed:`, await updateRes.text());
    }
  }
}

patchVapi().catch(console.error);
