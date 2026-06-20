import { getAdminDb, getAdminApp } from "./firebase-admin";
import * as admin from 'firebase-admin';

export async function sendLeadNotificationToAdmins(leadData: any) {
  try {
    const db = getAdminDb();
    
    // 1. Fetch all admin users
    const adminsSnapshot = await db.collection('users').where('role', 'in', ['Admin', 'Super Admin', 'HR']).get();
    
    const tokens: string[] = [];
    adminsSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
        tokens.push(...userData.fcmTokens);
      }
    });

    if (tokens.length === 0) {
      console.log('No admin FCM tokens found. Skipping push notification.');
      return;
    }

    // Deduplicate tokens
    const uniqueTokens = [...new Set(tokens)];

    // 2. Prepare the notification payload
    const message = {
      notification: {
        title: '🌟 New Lead Received!',
        body: `Name: ${leadData.name || "Unknown"}\nLoan Type: ${leadData.type || "N/A"}\nAmount: ₹${leadData.amount || "0"}`
      },
      data: {
        type: 'lead',
        leadId: leadData.id || ""
      },
      tokens: uniqueTokens
    };

    // 3. Send using Firebase Admin
    const messaging = getAdminApp().messaging();
    const response = await messaging.sendEachForMulticast(message);
    
    console.log(`Successfully sent ${response.successCount} messages; Failed to send ${response.failureCount} messages.`);
    
    // Optionally handle failed tokens (e.g., remove them from db if they are unregistered)
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Token failed: ${uniqueTokens[idx]}`, resp.error);
          // Could remove the invalid token from the database here
        }
      });
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
