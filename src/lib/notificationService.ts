import { getAdminDb, getAdminApp } from "./firebase-admin";

// Common helper to retrieve all unique FCM tokens for active admins who have not disabled a specific notification toggle.
async function getAdminFcmTokens(preferenceToggleKey: 'notifyLeads' | 'notifyPartners'): Promise<string[]> {
  const db = getAdminDb();
  
  // 1. Fetch all admin emails from admin_users collection
  const adminUsersSnap = await db.collection('admin_users')
    .where('role', 'in', ['Admin', 'Super Admin', 'HR'])
    .get();
    
  const adminEmails = ['swapnil.r.aher@gmail.com']; // Always include hardcoded super admin
  adminUsersSnap.forEach((doc) => {
    const email = doc.data().email;
    if (email && !adminEmails.includes(email)) {
      adminEmails.push(email);
    }
  });

  if (adminEmails.length === 0) {
    console.log('No admin emails found.');
    return [];
  }

  // 2. Fetch admin user documents from users collection by their emails
  const usersSnap = await db.collection('users')
    .where('email', 'in', adminEmails)
    .get();

  const tokens: string[] = [];
  usersSnap.forEach((doc) => {
    const userData = doc.data();
    // Respect the user's preference toggle (e.g. notifyLeads or notifyPartners)
    // If preference is explicitly false, skip notification tokens for this admin
    if (userData[preferenceToggleKey] === false) {
      console.log(`Skipping push notification for ${userData.email} because ${preferenceToggleKey} is disabled.`);
      return;
    }
    
    if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
      tokens.push(...userData.fcmTokens);
    }
  });

  return [...new Set(tokens)];
}

// Sends a push notification to all admins about a new lead
export async function sendLeadNotificationToAdmins(leadData: any) {
  try {
    const uniqueTokens = await getAdminFcmTokens('notifyLeads');

    if (uniqueTokens.length === 0) {
      console.log('No matching admin FCM tokens found for new lead notification.');
      return;
    }

    // Prepare the notification payload
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

    // Send using Firebase Admin
    const messaging = getAdminApp()!.messaging();
    const response = await messaging.sendEachForMulticast(message);
    
    console.log(`Successfully sent ${response.successCount} lead messages; Failed to send ${response.failureCount} messages.`);
    
    if (response.failureCount > 0) {
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          console.error(`FCM token failed for lead notification: ${uniqueTokens[idx]}`, resp.error);
        }
      });
    }
  } catch (error) {
    console.error('Error sending lead push notification:', error);
  }
}

// Sends a push notification to all admins about a new DSA partner registration
export async function sendPartnerNotificationToAdmins(partnerData: any) {
  try {
    const uniqueTokens = await getAdminFcmTokens('notifyPartners');

    if (uniqueTokens.length === 0) {
      console.log('No matching admin FCM tokens found for partner registration notification.');
      return;
    }

    // Prepare the notification payload
    const message = {
      notification: {
        title: '🤝 New DSA Partner Registered!',
        body: `Name: ${partnerData.name || "Unknown"}\nPhone: ${partnerData.phone || "N/A"}\nCode: ${partnerData.code || "Pending"}`
      },
      data: {
        type: 'partner',
        partnerId: partnerData.id || ""
      },
      tokens: uniqueTokens
    };

    // Send using Firebase Admin
    const messaging = getAdminApp()!.messaging();
    const response = await messaging.sendEachForMulticast(message);
    
    console.log(`Successfully sent ${response.successCount} partner registration messages; Failed to send ${response.failureCount} messages.`);
    
    if (response.failureCount > 0) {
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          console.error(`FCM token failed for partner notification: ${uniqueTokens[idx]}`, resp.error);
        }
      });
    }
  } catch (error) {
    console.error('Error sending partner push notification:', error);
  }
}
