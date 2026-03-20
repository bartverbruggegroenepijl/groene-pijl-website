import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Auth callback — wisselt de PKCE-code uit voor een sessie.
 *
 * Supabase stuurt de gebruiker hier naartoe na verificatie van de invite-link.
 * Flow: email-link → /auth/callback?code=xxx → /account/setup
 *
 * Stel in Supabase Dashboard → Authentication → URL Configuration → Redirect URLs in:
 *   https://www.groenepijl.nl/auth/callback
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/account/setup';

  if (code) {
    // BELANGRIJK: maak de redirect response EERST aan zodat de sessie-cookies
    // direct op deze response worden gezet. De gedeelde server-client schrijft
    // cookies naar `next/headers`, die NIET worden meegestuurd op een
    // NextResponse.redirect() — vandaar een inline client hier.
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Schrijf sessie-cookies op de redirect response
            // zodat de browser ze direct ontvangt na de redirect.
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response; // ← redirect MÉT sessie-cookies
    }
  }

  // Ongeldige of verlopen link → terug naar login met foutmelding
  return NextResponse.redirect(`${origin}/admin/login?error=invite_verlopen`);
}
