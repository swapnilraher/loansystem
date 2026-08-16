import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiAuth';
import {
  deactivateBanker,
  loadBankers,
  saveBanker,
  toRows,
  type Banker,
} from '@/lib/bankerDirectory';

/**
 * The banker directory.
 *
 * GET keeps the four shapes the banker lookup card has always asked for
 * (`metadata`, `cities`, `lenders`, and the default search) so nothing on the
 * leads screen changes — but it now answers from the shipped file *plus* the
 * Admin's edits, rather than the file alone. `directory` and `branches` are new
 * and serve the maintenance screen.
 *
 * Writes are Admin-only and verified against the caller's ID token. Hiding the
 * page would not be enough: this route writes with the service account, so an
 * unauthenticated POST would otherwise be able to add a banker to every
 * telecaller's lookup.
 */

const lower = (value: string | null) => (value || '').trim().toLowerCase();

function sortUnique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const bankers = await loadBankers();

    // 1. Metadata: every state and every product in the directory.
    if (action === 'metadata') {
      return NextResponse.json({
        success: true,
        states: sortUnique(bankers.map(b => b.state)),
        products: sortUnique(bankers.flatMap(b => b.products)),
      });
    }

    // 2. Districts within a state. Named `cities` because the lookup card and
    //    the banker file have always called them that.
    if (action === 'cities') {
      const state = url.searchParams.get('state') || 'Maharashtra';
      return NextResponse.json({
        success: true,
        cities: sortUnique(
          bankers.filter(b => lower(b.state) === lower(state)).map(b => b.district)
        ),
      });
    }

    // 3. Banks in a district, optionally narrowed to one product.
    if (action === 'lenders') {
      const state = url.searchParams.get('state');
      const city = url.searchParams.get('city');
      const product = url.searchParams.get('product');

      if (!state || !city) {
        return NextResponse.json(
          { success: false, error: 'state and city are required' },
          { status: 400 }
        );
      }

      const lenders = bankers
        .filter(
          b =>
            lower(b.state) === lower(state) &&
            lower(b.district) === lower(city) &&
            // The add-a-banker cascade asks for banks before a product is
            // chosen, so an absent product means "all of them".
            (!product || b.products.some(p => lower(p) === lower(product)))
        )
        .map(b => b.bank);

      return NextResponse.json({ success: true, lenders: sortUnique(lenders) });
    }

    // 4. Branches known for a bank in a district — free text, so this is a
    //    suggestion list rather than a closed set.
    if (action === 'branches') {
      const state = url.searchParams.get('state');
      const city = url.searchParams.get('city');
      const lender = url.searchParams.get('lender');

      const branches = bankers
        .filter(
          b =>
            (!state || lower(b.state) === lower(state)) &&
            (!city || lower(b.district) === lower(city)) &&
            (!lender || lower(b.bank) === lower(lender))
        )
        .map(b => b.branch);

      return NextResponse.json({ success: true, branches: sortUnique(branches) });
    }

    if (action === 'directory') {
      const search = lower(url.searchParams.get('search'));
      const state = url.searchParams.get('state');
      const district = url.searchParams.get('district') || url.searchParams.get('city');
      const bank = url.searchParams.get('bank') || url.searchParams.get('lender');
      const product = url.searchParams.get('product');
      const limit = Math.min(Number(url.searchParams.get('limit') || 100), 500);

      const filtered = bankers
        .filter(b => !state || lower(b.state) === lower(state))
        .filter(b => !district || lower(b.district) === lower(district))
        .filter(b => !bank || lower(b.bank) === lower(bank))
        .filter(b => !product || b.products.some(p => lower(p) === lower(product)))
        .filter(b => {
          if (!search) return true;
          return [b.name, b.mobile, b.bank, b.branch, b.district, b.state]
            .join(' ')
            .toLowerCase()
            .includes(search);
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      return NextResponse.json({
        success: true,
        total: filtered.length,
        bankers: filtered.slice(0, limit),
      });
    }

    // 6. Default: the banker search behind the lead detail card.
    const state = url.searchParams.get('state');
    const city = url.searchParams.get('city');
    const product = url.searchParams.get('product');
    const lender = url.searchParams.get('lender');

    if (!state || !city || !product) {
      return NextResponse.json(
        { success: false, error: 'state, city, and product are required' },
        { status: 400 }
      );
    }

    const filtered = toRows(bankers).filter(
      row =>
        lower(row.state) === lower(state) &&
        lower(row.district) === lower(city) &&
        lower(row.product) === lower(product) &&
        (!lender || lower(row.lender) === lower(lender))
    );

    return NextResponse.json({
      success: true,
      bankers: filtered.map(row => ({
        lender: row.lender,
        name: row.name,
        contact: row.contact,
        branch: row.branch,
      })),
    });
  } catch (err: unknown) {
    console.error('[api/admin/bankers] Read failed:', err);
    return NextResponse.json(
      { success: false, error: 'Could not read the banker directory.' },
      { status: 500 }
    );
  }
}

/** Body → a banker, with the fields the directory cannot work without checked. */
function readBanker(body: Record<string, unknown>): { banker?: Banker; error?: string } {
  const text = (key: string) => String(body[key] ?? '').trim();

  const name = text('name');
  const mobile = text('mobile');
  const state = text('state');

  if (!name) return { error: 'Banker name is required.' };
  if (!state) return { error: 'State is required.' };
  if (mobile && !/^[0-9+\-\s()]{6,20}$/.test(mobile)) {
    return { error: 'That mobile number does not look right.' };
  }

  const products = Array.isArray(body.products)
    ? Array.from(new Set(body.products.map(p => String(p).trim()).filter(Boolean)))
    : [];

  return {
    banker: {
      id: text('id'),
      state,
      district: text('district'),
      bank: text('bank'),
      branch: text('branch'),
      name,
      mobile,
      products,
      active: body.active !== false,
      edited: true,
    },
  };
}

/** Add a banker. */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { banker, error } = readBanker(body || {});
    if (!banker) return NextResponse.json({ success: false, error }, { status: 400 });

    // A new banker never carries an id: one is derived from who and where they
    // are, so adding the same person twice updates rather than duplicates.
    const id = await saveBanker({ ...banker, id: '' }, auth.caller.email);
    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (err: unknown) {
    console.error('[api/admin/bankers] Create failed:', err);
    return NextResponse.json({ success: false, error: 'Could not add the banker.' }, { status: 500 });
  }
}

/**
 * Edit a banker — including one from the shipped file, which is the whole point:
 * a banker who moved branch or changed number is updated in place, not deleted
 * and re-added.
 */
export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { banker, error } = readBanker(body || {});
    if (!banker) return NextResponse.json({ success: false, error }, { status: 400 });
    if (!banker.id) {
      return NextResponse.json(
        { success: false, error: 'Which banker to update was not given.' },
        { status: 400 }
      );
    }

    await saveBanker(banker, auth.caller.email);
    return NextResponse.json({ success: true, id: banker.id });
  } catch (err: unknown) {
    console.error('[api/admin/bankers] Update failed:', err);
    return NextResponse.json(
      { success: false, error: 'Could not update the banker.' },
      { status: 500 }
    );
  }
}

/** Hides a banker from the lookup. The record is kept — see `deactivateBanker`. */
export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

  try {
    await deactivateBanker(id, auth.caller.email);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[api/admin/bankers] Hide failed:', err);
    return NextResponse.json(
      { success: false, error: 'Could not hide the banker.' },
      { status: 500 }
    );
  }
}
