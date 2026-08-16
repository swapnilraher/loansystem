import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { hashPassword, verifyPassword, formatRemainingTime } from '@/lib/passwordSecurity';

/**
 * Verifies staff credentials against `admin_users`, enforces account lockout policies,
 * hashes passwords, and synchronizes with Firebase Auth.
 */

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Missing credentials' }, { status: 400 });
    }

    const normalisedEmail = String(email).trim().toLowerCase();
    const db = getAdminDb();
    
    const snapshot = await db
      .collection('admin_users')
      .where('email', '==', String(email).trim())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ message: 'Credentials do not match.' }, { status: 401 });
    }

    const docRef = snapshot.docs[0].ref;
    const staff = snapshot.docs[0].data();

    // 1. Account Inactive check
    if (staff.status === 'Inactive') {
      return NextResponse.json({ message: 'This staff account is deactivated.' }, { status: 403 });
    }

    // 2. Active Lockout Check
    if (staff.lockoutUntil) {
      const lockoutMs = new Date(staff.lockoutUntil).getTime();
      if (Date.now() < lockoutMs) {
        const remaining = formatRemainingTime(lockoutMs);
        const reason = staff.lockoutReason || 'Too many failed password attempts.';
        return NextResponse.json(
          { message: `Account is locked. ${reason} Try again in ${remaining}.` },
          { status: 403 }
        );
      }
    }

    // 3. Verify Password
    const { valid, isLegacyPlainText } = verifyPassword(String(password), staff.password);

    if (!valid) {
      // Wrong password attempt handling
      const currentAttempts = (staff.failedAttempts || 0) + 1;
      const currentLevel = staff.lockoutLevel || 0;

      if (currentAttempts >= 3) {
        let lockDurationMs = 30 * 60 * 1000; // 30 minutes default
        let newLevel = 1;
        let reason = 'Blocked for 30 minutes due to 3 wrong password attempts';

        if (currentLevel >= 1) {
          lockDurationMs = 24 * 60 * 60 * 1000; // 1 day (24 hours)
          newLevel = 2;
          reason = 'Blocked for 1 day due to repeated wrong password attempts';
        }

        const lockoutUntilDate = new Date(Date.now() + lockDurationMs).toISOString();

        await docRef.update({
          failedAttempts: 0,
          lockoutUntil: lockoutUntilDate,
          lockoutReason: reason,
          lockoutLevel: newLevel,
          updatedAt: new Date().toISOString(),
        });

        const remainingText = formatRemainingTime(Date.now() + lockDurationMs);
        return NextResponse.json(
          { message: `Account blocked. ${reason}. Try again in ${remainingText}.` },
          { status: 403 }
        );
      }

      // Record failed attempt count
      await docRef.update({
        failedAttempts: currentAttempts,
        updatedAt: new Date().toISOString(),
      });

      const remainingAttempts = 3 - currentAttempts;
      return NextResponse.json(
        { message: `Invalid credentials. ${remainingAttempts} attempt(s) remaining before account lockout.` },
        { status: 401 }
      );
    }

    // 4. Successful Password Verification: Reset Lockout Counters & Upgrade Hash if Legacy
    const newHash = hashPassword(String(password));
    const updates: Record<string, any> = {
      failedAttempts: 0,
      lockoutUntil: null,
      lockoutReason: null,
      lastLogin: new Date().toISOString(),
    };

    if (isLegacyPlainText) {
      updates.password = newHash;
    }

    await docRef.update(updates);

    // 5. Synchronize with Firebase Auth
    const auth = getAdminAuth();
    try {
      const existing = await auth.getUserByEmail(String(email).trim());
      await auth.updateUser(existing.uid, { password: String(password) });
      return NextResponse.json({ synced: 'updated', mustChangePassword: !!staff.mustChangePassword });
    } catch (err: any) {
      if (err?.code !== 'auth/user-not-found') throw err;
      await auth.createUser({
        email: String(email).trim(),
        password: String(password),
        displayName: staff.name || undefined,
      });
      return NextResponse.json({ synced: 'created', mustChangePassword: !!staff.mustChangePassword });
    }
  } catch (error: any) {
    console.error('[sync-password] Failed:', error);
    return NextResponse.json({ message: 'Could not process authentication.' }, { status: 500 });
  }
}
