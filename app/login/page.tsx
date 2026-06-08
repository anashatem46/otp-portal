import { LoginForm } from "@/components/auth/LoginForm";
import { redirectIfAuthenticated } from "@/lib/page-auth";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded border border-line bg-white p-6 shadow-panel">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">OTP Sharing Portal</h1>
          <p className="mt-1 text-sm text-slate-600">Sign in with your team credentials.</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
