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

async function getNotificationSettings() {
  try {
    const db = getAdminDb()
    const snap = await db.collection("system_settings").doc("notifications").get()
    if (snap.exists) {
      return snap.data()
    }
  } catch (err) {
    console.warn("Could not load system_settings/notifications, using defaults:", err)
  }
  return null
}

// Sends a delayed push notification to all admins about a new lead including Name and City based on Admin Settings
export async function sendLeadNotificationToAdmins(leadData: any, customDelayMs?: number) {
  const dispatchNotification = async () => {
    try {
      const settings = await getNotificationSettings()

      // Determine delay: Settings delayMinutes (converted to ms) or custom or 2.5 minutes (150000ms)
      let delayMs = 150000
      if (customDelayMs !== undefined) {
        delayMs = customDelayMs
      } else if (settings && typeof settings.delayMinutes === "number") {
        delayMs = settings.delayMinutes * 60 * 1000
      }

      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }

      const uniqueTokens = await getAdminFcmTokens('notifyLeads')

      if (uniqueTokens.length === 0) {
        console.log('No matching admin FCM tokens found for new lead notification.')
        return
      }

      // Re-fetch latest lead details from database after delay (to include answers collected during delay e.g. via chatbot/pincode)
      let currentLead = { ...leadData }
      if (leadData?.id) {
        try {
          const db = getAdminDb()
          const docSnap = await db.collection("leads").doc(leadData.id).get()
          if (docSnap.exists) {
            currentLead = { id: docSnap.id, ...docSnap.data() }
          }
        } catch (fetchErr) {
          console.error("Error fetching latest lead details for notification:", fetchErr)
        }
      }

      const name = currentLead.name || currentLead.fullName || currentLead.panName || leadData.name || "Customer"
      
      // Loan Type (type / loanType / category)
      const type = currentLead.type || currentLead.loanType || currentLead.category || leadData.type || "Personal Loan"

      // Extract subdistrict (taluka) and city (district)
      const subdistrict = (
        currentLead.subdistrict ||
        currentLead.taluka ||
        currentLead.pinTaluka ||
        currentLead.block ||
        ""
      ).trim()

      const rawCity = (
        currentLead.city ||
        currentLead.district ||
        currentLead.pinCity ||
        currentLead.pinDistrict ||
        currentLead.location ||
        leadData.city ||
        ""
      ).trim()

      let city = rawCity || "N/A"
      if (subdistrict) {
        if (rawCity && !rawCity.toLowerCase().includes(subdistrict.toLowerCase())) {
          city = `${subdistrict}, ${rawCity}`
        } else if (!rawCity) {
          city = subdistrict
        }
      }

      const amount = currentLead.amount || currentLead.loanAmount || leadData.amount
      const mobile = currentLead.phone || currentLead.mobile || currentLead.mobileNumber || leadData.phone
      const source = currentLead.source || leadData.source

      const title = (settings && settings.leadTitle) || '🌟 New Lead Received!'
      const includeName = settings ? settings.includeName !== false : true
      const includeCity = settings ? settings.includeCity !== false : true
      const includeType = settings ? settings.includeType !== false : true
      const includeAmount = settings ? settings.includeAmount !== false : true
      const includeMobile = settings ? settings.includeMobile === true : false
      const includeSource = settings ? settings.includeSource === true : false

      const bodyLines: string[] = []
      if (includeName) bodyLines.push(`Name: ${name}`)
      if (includeCity) bodyLines.push(`City: ${city}`)
      if (includeType) bodyLines.push(`Loan Type: ${type}`)
      if (includeAmount && amount) bodyLines.push(`Amount: ₹${amount}`)
      if (includeMobile && mobile) bodyLines.push(`Mobile: ${mobile}`)
      if (includeSource && source) bodyLines.push(`Source: ${source}`)

      // Notification Payload with Name & City
      const message = {
        notification: {
          title,
          body: bodyLines.join('\n') || `New lead received from ${city}`
        },
        data: {
          type: 'lead',
          leadId: leadData.id || ""
        },
        tokens: uniqueTokens
      }

      // Send using Firebase Admin
      const messaging = getAdminApp()!.messaging()
      const response = await messaging.sendEachForMulticast(message)

      console.log(`Successfully sent ${response.successCount} delayed lead notification(s) for ${name} (${city}).`)

      if (response.failureCount > 0) {
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            console.error(`FCM token failed for lead notification: ${uniqueTokens[idx]}`, resp.error)
          }
        })
      }
    } catch (error) {
      console.error('Error sending delayed lead push notification:', error)
    }
  }

  // Execute asynchronously in background
  void dispatchNotification()
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
