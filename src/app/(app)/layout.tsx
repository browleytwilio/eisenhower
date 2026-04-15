import { headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}
