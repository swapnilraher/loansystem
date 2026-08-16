import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { normalizeRole } from '@/lib/permissions';

/**
 * Stamps the signed-in staff member's CRM role onto their Firebase Auth token.
 *
 * Firestore security rules cannot run a query, so they cannot look a person up
 * in `admin_users` by email — which is the only way this CRM identifies staff.
 * Custom claims close that gap: this route is the one place that reads the staff
 * record and mirrors the answer into the token, and `firestore.rules` then
 * trusts nothing but `request.auth.token`.
 *
 * The caller proves who they are with their own ID token, so this grants no more
 * than their existing session already does. It is safe to call on every sign-in
 * and it is deliberately idempotent — claims are only written when they change,
 * because every write forces the client to refresh its token.
 */

const PRIMARY_ADMIN_EMAIL = 'swapnil.r.aher@gmail.com';

interface CrmClaims {
  /** Present and true only for active staff. Rules gate every CRM read on this. */
  crm: boolean;
  /** One of the three CRM roles, already normalised from the stored label. */
  crmRole: string | null;
  /** `admin_users` document id — lets rules match legacy `assignedTo` values. */
  staffId: string | null;
}

const NO_ACCESS: CrmClaims = { crm: false, crmRole: null, staffId: null };

function sameClaims(a: Record<string, unknown> | undefined, b: CrmClaims): boolean {
  return (
    !!a && a.crm === b.crm && a.crmRole === b.crmRole && a.staffId === b.staffId
  );
}

export async function POST(request: Request) {
  const header = request.headers.get('authorization') || '';
  const idToken = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (!idToken) {
    return NextResponse.json({ message: 'Missing ID token' }, { status: 401 });
  }

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken, true);
    const email = (decoded.email || '').trim();

    let claims: CrmClaims = NO_ACCESS;

    if (email.toLowerCase() === PRIMARY_ADMIN_EMAIL) {
      // The founding account predates the staff table and has no record in it.
      claims = { crm: true, crmRole: 'Admin', staffId: null };
    } else if (email) {
      const snapshot = await getAdminDb()
        .collection('admin_users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const staffDoc = snapshot.docs[0];
        const staff = staffDoc.data();

        // Deactivated accounts keep their record but lose every claim.
        if (staff.status !== 'Inactive') {
          claims = {
            crm: true,
            crmRole: normalizeRole(staff.role),
            staffId: staffDoc.id,
          };
        }

        /**
         * Staff records are created before the person has ever signed in, so
         * they carry no Auth uid — which is what split lead ownership into two
         * id shapes (see `ViewerIdentity`). Link them here rather than from the
         * browser: the rules below deny client writes to `admin_users`.
         */
        if (staff.uid !== decoded.uid) {
          await staffDoc.ref.update({ uid: decoded.uid });
        }
      }
    }

    // Rewriting identical claims would force a pointless token refresh on the
    // client, so only write when something actually changed.
    if (!sameClaims(decoded as unknown as Record<string, unknown>, claims)) {
      await auth.setCustomUserClaims(decoded.uid, claims);
      return NextResponse.json({ ...claims, refreshed: true });
    }

    return NextResponse.json({ ...claims, refreshed: false });
  } catch (error: unknown) {
    console.error('[auth/claims] Failed:', error);
    return NextResponse.json({ message: 'Could not resolve CRM access.' }, { status: 401 });
  }
}
