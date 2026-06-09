import { KeyRound } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { redirectIfAuthenticated } from "@/lib/page-auth";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <main className="grid min-h-screen place-items-center bg-field px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-line bg-white p-8 shadow-panel">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-moss text-white">
            <KeyRound size={22} />
          </span>
          <h1 className="text-xl font-semibold text-ink">OTP Sharing Portal</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in with your team credentials.</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
