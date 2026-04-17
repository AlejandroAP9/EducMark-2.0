import { NextResponse } from 'next/server';

const FALLBACK_URL =
    'https://gjudfgpudbqdhclbmjjo.supabase.co/storage/v1/object/public/EducMark/Ebook%20EducMark.pdf';

export async function GET() {
    const target = process.env.NEXT_PUBLIC_EBOOK_URL || FALLBACK_URL;
    return NextResponse.redirect(target, 302);
}
