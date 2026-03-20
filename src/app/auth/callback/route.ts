import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Auth callback — wisselt de PKCE-code uit voor een sessie.
 * Supabase stuurt de gebruiker hier naartoe na verificatie van
 * de invite-link, magic link of OAuth flow.
 *
 * Redirect-URL in Supabase e-mailtemplate:
 *   https://www.groenepijl.nl/auth/callback?next=/account/setup
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/account/setup';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Ongeldige of verlopen link → terug naar login met foutmelding
  return NextResponse.redirect(
    `${origin}/admin/login?error=invite_verlopen`,
  );
}
