import { getUserSession } from "../../lib/auth";

import { redirect } from "next/navigation"; 

export default async function Home() {
  const user = await getUserSession();

  if (!user) {
    redirect("/api/auth/signin");
  }

  return <>{JSON.stringify(user)}</>;
}