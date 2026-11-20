import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: {
      memberships: {
        include: {
          project: {
            include: {
              members: { include: { user: true } },
              tasks: true,
              _count: { select: { tasks: true, members: true } },
            },
          },
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const projects = user.memberships.map((m) => ({
    ...m.project,
    myRole: m.role,
    mySkills: m.skills,
    myExperience: m.experience,
    myAvailability: m.availability,
  }));

  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, university: user.university, faculty: user.faculty, department: user.department, avatarUrl: user.avatarUrl }, projects });
}
