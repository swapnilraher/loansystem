import { getAdminDb } from "@/lib/firebase-admin";

/**
 * Generates a unique, sequential DSA Partner code starting from TMS-550.
 * Example sequence: TMS-550, TMS-551, TMS-552, ...
 */
export async function generateNextDsaCode(dbInstance?: any): Promise<string> {
  const db = dbInstance || getAdminDb();
  const counterRef = db.collection("counters").doc("dsa_code");

  return await db.runTransaction(async (transaction: any) => {
    const counterDoc = await transaction.get(counterRef);
    let nextNum = 550;

    if (counterDoc.exists) {
      const lastNum = counterDoc.data()?.lastNumber;
      if (typeof lastNum === "number" && lastNum >= 550) {
        nextNum = lastNum + 1;
      }
    } else {
      // Find existing TMS- code numbers in users collection if any
      const usersSnap = await db.collection("users")
        .where("role", "==", "partner")
        .get();

      let highestNum = 549;
      usersSnap.forEach((docSnap: any) => {
        const dCode = docSnap.data()?.dsaCode;
        if (dCode && typeof dCode === "string") {
          const match = dCode.match(/^TMS-(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > highestNum) highestNum = num;
          }
        }
      });
      nextNum = Math.max(550, highestNum + 1);
    }

    transaction.set(counterRef, { lastNumber: nextNum, updatedAt: new Date() }, { merge: true });
    return `TMS-${nextNum}`;
  });
}
