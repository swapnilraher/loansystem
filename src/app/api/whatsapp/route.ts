import { NextResponse } from 'next/server';
import { getAdminDb } from "@/lib/firebase-admin";
import { WHATSAPP_PHONE_ID, WHATSAPP_TOKEN } from "@/lib/whatsappConfig";
import { defaultMediaText, mediaProxyPath } from "@/lib/whatsappMediaShared";

// Credentials now live in one place — see `@/lib/whatsappConfig`.
const PHONE_ID = WHATSAPP_PHONE_ID;
const TOKEN = WHATSAPP_TOKEN;

// Outbound WhatsApp message sender (for OTP, notifications, manual messages)
export async function POST(request: Request) {
  try {
    const { phone, message, leadId, senderName, senderUid, mediaType, mediaUrl, filename, mediaId, templateName, templateLang, customerName, customername, name } = await request.json();
    
    if (!phone) {
      return NextResponse.json({ success: false, error: "Phone number is required" }, { status: 400 });
    }
    
    if (!message && !mediaUrl && !mediaId && !templateName) {
      return NextResponse.json({ success: false, error: "Message, templateName, mediaId or mediaUrl is required" }, { status: 400 });
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const phone10 = finalPhone.startsWith('91') && finalPhone.length === 12 ? finalPhone.substring(2) : finalPhone;

    const url = `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`;
    
    let body: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: finalPhone
    };

    if (templateName) {
      const nameVal = customerName || customername || name || senderName || "Partner";
      const lang = templateLang || (templateName === "connector" || templateName === "car3" || templateName === "cars" || templateName === "car2" ? "en" : "en_US");
      
      const components: any[] = [];

      // If template is connector, it requires a header image
      if (templateName === "connector") {
        components.push({
          type: "header",
          parameters: [
            {
              type: "image",
              image: {
                link: mediaUrl || "https://partner.techstarsolution.in/og-image.png"
              }
            }
          ]
        });
      }

      components.push({
        type: "body",
        parameters: [
          {
            type: "text",
            parameter_name: "customer_name",
            text: nameVal
          }
        ]
      });

      body.type = "template";
      body.template = {
        name: templateName,
        language: { code: lang },
        components
      };
    } else if (mediaId) {
      /**
       * Preferred path: the file already lives on Meta's media store (uploaded
       * via /api/whatsapp/upload), so it is sent by id and needs no public URL
       * of our own. `mediaType` here is the Cloud API message type.
       */
      const kind = mediaType === 'image' || mediaType === 'video' ? mediaType : 'document';
      body.type = kind;
      if (kind === 'document') {
        body.document = { id: mediaId, filename: filename || "Document", caption: message || "" };
      } else {
        body[kind] = { id: mediaId, caption: message || "" };
      }
    } else if (mediaType === 'image' && mediaUrl) {
      body.type = 'image';
      body.image = {
        link: mediaUrl,
        caption: message || ""
      };
    } else if (mediaType === 'document' && mediaUrl) {
      body.type = 'document';
      body.document = {
        link: mediaUrl,
        filename: filename || "Document",
        caption: message || ""
      };
    } else {
      body.type = "text";
      body.text = {
        body: message
      };
    }

    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    let result = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API Error:', result);
      return NextResponse.json({ success: false, error: result.error?.message || 'Failed to send message' }, { status: response.status });
    }

    // Save message to database & mute bot
    try {
      const db = getAdminDb();
      const sentKind = mediaId
        ? (mediaType === 'image' || mediaType === 'video' ? mediaType : 'document')
        : mediaType;
      await db.collection("whatsapp_messages").add({
        phone: phone10,
        leadId: leadId || "",
        text: message || (sentKind ? defaultMediaText(sentKind, filename) : ""),
        sender: "staff",
        userName: senderName || "Staff",
        timestamp: new Date(),
        mediaType: sentKind || "",
        // Media sent by id is read back through the same proxy the inbound side
        // uses, so the thread renders it without any file hosting of our own.
        mediaUrl: mediaId ? mediaProxyPath(mediaId) : (mediaUrl || ""),
        mediaId: mediaId || "",
        filename: filename || ""
      });

      // Mute the automated bot for this lead & auto-claim if unassigned
      if (leadId) {
        const leadRef = db.collection("leads").doc(leadId);
        const leadSnap = await leadRef.get();
        if (leadSnap.exists) {
          const leadData = leadSnap.data();
          const updateData: any = {
            botMuted: true,
            updatedAt: new Date()
          };
          if (!leadData?.assignedTo && senderUid && senderName) {
            updateData.assignedTo = senderUid;
            updateData.assignedToName = senderName;
            if (leadData?.status === "New Lead" || leadData?.status === "New") {
              updateData.status = "Contacted";
            }
          }
          await leadRef.update(updateData);
        }
      }
    } catch (dbError) {
      console.error('Failed to log WhatsApp chat message / mute bot:', dbError);
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('WhatsApp Route Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
