import { getAuth } from "@/lib/auth";
import type { NextRequest } from "next/server";

async function handleAuth(req: NextRequest) {
  try {
    return await getAuth().handler(req);
  } catch (error) {
    console.error("[AUTH_ERROR]", req.method, req.nextUrl.pathname, error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return handleAuth(req);
}

export async function POST(req: NextRequest) {
  return handleAuth(req);
}
