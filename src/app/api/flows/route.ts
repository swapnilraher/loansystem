import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiAuth';
import {
  deleteFlow,
  loadFlowConfigForAdmin,
  saveFlow,
  saveSettings,
} from '@/lib/waFlowStore';
import { sanitizeFlow, sanitizeMessages, slugify } from '@/lib/waFlows';

/**
 * The WhatsApp bot's script, as edited from the CRM.
 *
 * Admin only, and checked here rather than only in the browser: this route
 * writes with the service account, so without `requireAdmin` anyone who found
 * the URL could rewrite what the bot says to every customer. The old version of
 * this file had no authentication at all.
 *
 * Reads are Admin-only too. The flows are not secret, but the only screen that
 * asks for them is the editor, and a route that answers everybody is a route
 * somebody eventually writes to.
 */

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const config = await loadFlowConfigForAdmin();
    return NextResponse.json({ success: true, ...config });
  } catch (err: unknown) {
    console.error('[api/flows] Read failed:', err);
    return NextResponse.json(
      { success: false, error: 'Could not load the flow configuration.' },
      { status: 500 }
    );
  }
}

/**
 * Creates or replaces one flow. The document id is the flow's own `id`, so
 * saving the same flow twice updates it instead of stacking duplicates that the
 * bot would then have to choose between.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const flow = sanitizeFlow(body?.flow ?? body);
    if (!flow) {
      return NextResponse.json(
        { success: false, error: 'A flow needs a category and at least a name.' },
        { status: 400 }
      );
    }
    if (flow.steps.length === 0) {
      return NextResponse.json(
        { success: false, error: 'A flow needs at least one question.' },
        { status: 400 }
      );
    }

    flow.id = flow.id || slugify(flow.category);
    await saveFlow(flow);
    return NextResponse.json({ success: true, id: flow.id });
  } catch (err: unknown) {
    console.error('[api/flows] Save failed:', err);
    return NextResponse.json({ success: false, error: 'Could not save the flow.' }, { status: 500 });
  }
}

/** Bot messages and the master automation switch. */
export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const messages = body?.messages ? sanitizeMessages(body.messages) : undefined;
    const automationEnabled =
      typeof body?.automationEnabled === 'boolean' ? body.automationEnabled : undefined;

    if (!messages && automationEnabled === undefined) {
      return NextResponse.json({ success: false, error: 'Nothing to update.' }, { status: 400 });
    }

    await saveSettings({ messages, automationEnabled });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[api/flows] Settings save failed:', err);
    return NextResponse.json(
      { success: false, error: 'Could not save the settings.' },
      { status: 500 }
    );
  }
}

/**
 * Drops the stored copy of a flow. One that ships with the build reverts to its
 * shipped questions rather than disappearing — see `deleteFlow`.
 */
export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

  try {
    await deleteFlow(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[api/flows] Delete failed:', err);
    return NextResponse.json({ success: false, error: 'Could not delete the flow.' }, { status: 500 });
  }
}
