import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { getCurrentUser } from "@/lib/session";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded border border-line bg-white p-6 shadow-panel">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Change password</h1>
          <p className="mt-1 text-sm text-slate-600">
            Signed in as {user.username}
          </p>
        </div>
        <ChangePasswordForm />
      </section>
    </main>
  );
}
