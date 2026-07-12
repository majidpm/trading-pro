import { NextResponse } from 'next/server';

export async function GET() {
  const now = new Date();
  const iranDate = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Tehran"
  });
  return NextResponse.json({
    utc: now.toISOString(),
    iranDate: iranDate,
    serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
}