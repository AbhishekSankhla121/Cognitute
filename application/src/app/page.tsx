import { getUserSession } from "../../lib/auth";


export default async function Home() {
  const user = await getUserSession()
  return (
    <>{JSON.stringify(user)}</>
  );
}
