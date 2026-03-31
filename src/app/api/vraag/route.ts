import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email, question } = await req.json();

  if (!email || !question) {
    return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 });
  }

  await resend.emails.send({
    from: 'Groene Pijl <noreply@groenepijl.nl>',
    to: 'groenepijlpraat@gmail.com',
    subject: `Nieuwe luisteraarsvraag van ${email}`,
    html: `
      <h2>Nieuwe vraag voor de podcast!</h2>
      <p><strong>Van:</strong> ${email}</p>
      <p><strong>Vraag:</strong></p>
      <blockquote>${question}</blockquote>
    `,
  });

  return NextResponse.json({ success: true });
}
