'use client';

import { useEffect } from 'react';

/**
 * Detecteert #error= in de URL hash (bijv. #error=access_denied van Supabase)
 * en stuurt de gebruiker door naar /account/setup zodat de foutmelding
 * daar getoond wordt. De hash wordt meegestuurd zodat de setup-pagina
 * de juiste fout kan tonen.
 */
export default function ErrorHashRedirect() {
  useEffect(() => {
    if (window.location.hash.includes('error=')) {
      window.location.replace('/account/setup' + window.location.hash);
    }
  }, []);

  return null;
}
