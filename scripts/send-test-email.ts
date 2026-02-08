import { Resend } from "resend";
import { config } from "dotenv";

config({ path: ".env" });

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  console.log("Sending test email...");

  const to = process.argv[2] || "belze@ymail.ne.jp";
  console.log(`To: ${to}`);

  const { data, error } = await resend.emails.send({
    from: "Seisei <noreply@seisei.me>",
    to,
    subject: "Test message from Seisei",
    html: `
      <h1>Hello from Seisei 👋</h1>
      <p>This is a test email to confirm that email sending is working correctly.</p>
      <p>Sent at: ${new Date().toISOString()}</p>
    `,
  });

  if (error) {
    console.error("❌ Failed to send email:", error);
    process.exit(1);
  }

  console.log("✅ Email sent successfully!");
  console.log("Email ID:", data?.id);
}

main();
