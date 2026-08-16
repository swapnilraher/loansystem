import { NextResponse } from 'next/server';
import { sendPartnerNotificationToAdmins } from "@/lib/notificationService";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    await sendPartnerNotificationToAdmins({
      id: data.id || "",
      name: data.name || "N/A",
      phone: data.phone || "N/A",
      code: data.code || "Pending"
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PARTNER NOTIFY API ERROR:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
