export interface Env {
  SEND_EMAIL: any;
  DB: any;
}

function decodeMimeHeader(header: string): string {
  const mimeRegex = /=\?([^?]+)\?([QBqb])\?([^?]*)\?=/g;
  return header.replace(mimeRegex, (match, charset, encoding, encodedText) => {
    if (encoding.toUpperCase() === "B") {
      try {
        const binaryString = atob(encodedText);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const decoder = new TextDecoder(charset || "utf-8");
        return decoder.decode(bytes);
      } catch (e) {
        return match;
      }
    } else if (encoding.toUpperCase() === "Q") {
      let hexString = encodedText.replace(/_/g, " ");
      const bytes: number[] = [];
      for (let i = 0; i < hexString.length; i++) {
        if (hexString[i] === "=") {
          const hex = hexString.substr(i + 1, 2);
          bytes.push(parseInt(hex, 16));
          i += 2;
        } else {
          bytes.push(hexString.charCodeAt(i));
        }
      }
      try {
        const decoder = new TextDecoder(charset || "utf-8");
        return decoder.decode(new Uint8Array(bytes));
      } catch (e) {
        return match;
      }
    }
    return match;
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const { to, subject, body } = await request.json() as { to: string; subject: string; body: string };
      
      if (!to || !subject || !body) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const { EmailMessage } = await import("cloudflare:email");
      const rawMessage = 
        `Subject: ${subject}\n` +
        `Content-Type: text/plain; charset=utf-8\n` +
        `From: Touring Mania <noreply@nirin-hub.me>\n` +
        `To: ${to}\n\n` +
        `${body}`;

      const msg = new EmailMessage(
        "noreply@nirin-hub.me",
        to,
        rawMessage
      );
      
      await env.SEND_EMAIL.send(msg);
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (err: any) {
      console.error("Email send error:", err);
      return new Response(JSON.stringify({ error: err.message || "Failed to send email" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },

  async email(message: any, env: Env, ctx: any): Promise<void> {
    const rawSubject = message.headers.get("subject") || "";
    const subject = decodeMimeHeader(rawSubject);
    console.log(`[EMAIL ROUTING] Raw subject: "${rawSubject}", Decoded subject: "${subject}"`);
    
    // Extract 6-character alphanumeric code (case-insensitive in match, will convert to uppercase)
    const codeMatch = subject.match(/[A-Z0-9]{6}/i);
    if (!codeMatch) {
      console.log(`[EMAIL ROUTING] No 6-digit alphanumeric code found in subject: "${subject}"`);
      return;
    }

    const code = codeMatch[0].toUpperCase();
    const fromEmail = message.from.toLowerCase().trim();
    const now = Math.floor(Date.now() / 1000); // Drizzle stores timestamp as UNIX seconds in SQLite

    try {
      // Find matching pending OTP within expiry and set its status to verified
      const result = await env.DB.prepare(
        "UPDATE otps SET status = 'verified' WHERE LOWER(email) = ? AND UPPER(code) = ? AND status = 'pending' AND expiresAt > ?"
      ).bind(fromEmail, code, now).run();

      if (result.meta.changes > 0) {
        console.log(`[EMAIL ROUTING] Successfully verified OTP for ${fromEmail} with code ${code}`);
      } else {
        console.log(`[EMAIL ROUTING] No pending OTP found for ${fromEmail} with code ${code} (or already expired/verified)`);
      }
    } catch (err) {
      console.error("[EMAIL ROUTING] Error updating OTP status in D1:", err);
    }
  }
};
