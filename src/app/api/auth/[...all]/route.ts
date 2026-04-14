import { getAuth } from "@/lib/auth";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return getAuth().handler(req);
}

export async function POST(req: NextRequest) {
  return getAuth().handler(req);
}
