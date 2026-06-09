import { google } from "googleapis";

/**
 * Creates an authenticated Gmail API client
 */
export async function getGmailClient(refreshToken: string) {
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const host = process.env.NEXT_PUBLIC_APP_URL || "localhost:3000";
  let appUrl = host.startsWith("http") ? host : `${protocol}://${host}`;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${appUrl}/api/auth/google/callback`
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

/**
 * Gets all unread emails from the inbox
 */
export async function getUnreadEmails(refreshToken: string) {
  const gmail = await getGmailClient(refreshToken);
  
  const response = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread in:inbox",
  });

  const messages = response.data.messages || [];
  const fullEmails = [];

  for (const message of messages) {
    if (!message.id) continue;
    
    const msgData = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
      format: "full"
    });

    const payload = msgData.data.payload;
    const headers = payload?.headers || [];
    
    const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject";
    const from = headers.find((h) => h.name === "From")?.value || "Unknown";
    const to = headers.find((h) => h.name === "To")?.value || "Unknown";
    
    // Extract body
    let body = "";
    if (payload?.parts) {
      // Find the text/plain part
      const textPart = payload.parts.find((part) => part.mimeType === "text/plain");
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, "base64").toString();
      } else {
        // Fallback to html
        const htmlPart = payload.parts.find((part) => part.mimeType === "text/html");
        if (htmlPart?.body?.data) {
          body = Buffer.from(htmlPart.body.data, "base64").toString();
          // Extremely basic strip HTML
          body = body.replace(/<[^>]*>?/gm, '');
        }
      }
    } else if (payload?.body?.data) {
      body = Buffer.from(payload.body.data, "base64").toString();
    }

    fullEmails.push({
      id: message.id,
      threadId: msgData.data.threadId,
      subject,
      from,
      to,
      body,
      date: headers.find((h) => h.name === "Date")?.value || new Date().toISOString()
    });
  }

  return fullEmails;
}

/**
 * Marks an email as read
 */
export async function markEmailAsRead(refreshToken: string, messageId: string) {
  const gmail = await getGmailClient(refreshToken);
  
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: ["UNREAD"]
    }
  });
}

/**
 * Sends a reply to an email thread
 */
export async function sendEmailReply(refreshToken: string, to: string, subject: string, bodyText: string, threadId: string) {
  const gmail = await getGmailClient(refreshToken);
  
  // Gmail requires the raw email to be base64url encoded
  const messageParts = [
    `To: ${to}`,
    `Subject: Re: ${subject.replace(/^Re:\s*/i, "")}`,
    `In-Reply-To: ${threadId}`,
    `References: ${threadId}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    "",
    bodyText
  ];
  
  const rawMessage = messageParts.join("\n");
  const encodedMessage = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
    
  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
      threadId: threadId
    }
  });
}
