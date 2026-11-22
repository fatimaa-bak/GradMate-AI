import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const Schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Za-z]/).regex(/[0-9]/),
  university: z.string().min(2),
  faculty: z.string().min(2),
  department: z.string().min(2),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const d = parsed.data;

    const existing = await db.user.findUnique({ where: { email: d.email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(d.password, 10);
    const user = await db.user.create({
      data: {
        name: d.name,
        email: d.email.toLowerCase(),
        passwordHash,
        university: d.university,
        faculty: d.faculty,
        department: d.department,
      },
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string };
    return NextResponse.json(
      {
        error: "register_failed",
        message: String(e?.message || err),
        code: e?.code,
        dbUrlSet: !!process.env.DATABASE_URL,
      },
      { status: 500 }
    );
  }
}
