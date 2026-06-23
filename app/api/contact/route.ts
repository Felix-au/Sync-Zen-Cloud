import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, message } = body;

    // 1. Validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ success: false, message: "Name is required." }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ success: false, message: "Valid email is required." }, { status: 400 });
    }
    if (!message || typeof message !== "string" || message.trim() === "") {
      return NextResponse.json({ success: false, message: "Message is required." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("Missing RESEND_API_KEY environment variable.");
      return NextResponse.json({ success: false, message: "Mail configuration error." }, { status: 500 });
    }

    // 2. Email 1: Developer Notification
    const devMailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SyncZen <synczen@felix-au.me>",
        to: "felixaugum@gmail.com",
        reply_to: email,
        subject: `SyncZen: New Inquiry from ${name}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #1e293b;">
            <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); overflow: hidden;">
              <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 24px 32px; color: #ffffff;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">New Contact Inquiry</h2>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.85); font-weight: 500;">SyncZen Landing Page Submission</p>
              </div>
              <div style="padding: 32px; font-size: 14px; line-height: 1.6;">
                <p style="margin: 0 0 24px 0; font-size: 15px; color: #0f172a;">You have received a new message through the SyncZen contact form:</p>
                
                <div style="margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
                  <p style="margin: 0 0 8px 0;"><strong style="color: #475569; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">Sender Details</strong></p>
                  <p style="margin: 0 0 4px 0;"><span style="color: #64748b;">Name:</span> <strong style="color: #0f172a;">${name}</strong></p>
                  <p style="margin: 0;"><span style="color: #64748b;">Email:</span> <a href="mailto:${email}" style="color: #4f46e5; text-decoration: none; font-weight: 600;">${email}</a></p>
                </div>

                <div>
                  <p style="margin: 0 0 8px 0;"><strong style="color: #475569; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">Message Body</strong></p>
                  <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 18px 20px; border-radius: 4px; font-style: italic; color: #334155; white-space: pre-line; font-size: 14px; line-height: 1.6;">
                    "${message}"
                  </div>
                </div>
              </div>
              <div style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.5;">This email was securely routed from the SyncZen Workspace contact form. Click "Reply" to respond directly to the sender.</p>
              </div>
            </div>
          </div>
        `,
      }),
    });

    const devMailData = await devMailRes.json();
    if (!devMailRes.ok) {
      console.error("Developer notification mail failed:", devMailData);
      return NextResponse.json({ success: false, message: devMailData.message || "Failed to dispatch email." }, { status: devMailRes.status });
    }

    // 3. Email 2: User Confirmation Copy
    const userMailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SyncZen Support <synczen@felix-au.me>",
        to: email,
        subject: "We received your message - SyncZen Support",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #1e293b;">
            <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); overflow: hidden;">
              <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 24px 32px; color: #ffffff;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Message Received</h2>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.85); font-weight: 500;">SyncZen Support Confirmation</p>
              </div>
              <div style="padding: 32px; font-size: 14px; line-height: 1.6; color: #334155;">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f172a;">Hello ${name},</p>
                <p style="margin: 0 0 16px 0;">Thank you for getting in touch! We have successfully received your message. A developer (Felix Au) will review your request and get back to you as soon as possible.</p>
                <p style="margin: 0 0 24px 0;">For your records, here is a copy of the details you submitted:</p>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                  <p style="margin: 0 0 10px 0;"><strong style="color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Your Submitted Message</strong></p>
                  <div style="font-style: italic; color: #334155; white-space: pre-line; font-size: 14px; line-height: 1.6;">
                    "${message}"
                  </div>
                </div>
                
                <p style="margin: 0 0 4px 0; font-weight: 600; color: #0f172a;">Best regards,</p>
                <p style="margin: 0; color: #6366f1; font-weight: 700;">The SyncZen Team</p>
              </div>
              <div style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.5;">This is an automated confirmation email. Please do not reply directly to this message.</p>
              </div>
            </div>
          </div>
        `,
      }),
    });

    const userMailData = await userMailRes.json();
    if (!userMailRes.ok) {
      console.warn("User confirmation copy email failed to dispatch:", userMailData);
    }

    return NextResponse.json({ success: true, message: "Message dispatched successfully." });
  } catch (error: any) {
    console.error("Contact API Exception:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}
