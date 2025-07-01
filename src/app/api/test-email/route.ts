import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER,
      port: Number(process.env.EMAIL_PORT),
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.verify();

    return NextResponse.json({ success: true, message: 'SMTP connection successful.' });
  } catch (error) {
    console.error('Email connection test error:', error);
    return NextResponse.json({ success: false, error: 'SMTP connection failed.', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
