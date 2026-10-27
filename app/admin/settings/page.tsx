import { Bell, KeyRound, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { requirePageAdmin } from "@/lib/page-auth";

const settings = [
  {
    title: "Security",
    description: "Password rotation and encrypted OTP handling.",
    icon: ShieldCheck
  },
  {
    title: "Notifications",
    description: "Alerts for requests, reviews, and access changes.",
    icon: Bell
  },
  {
    title: "Secrets",
    description: "TOTP secret storage and key management status.",
    icon: KeyRound
  }
];

export default async function AdminSettingsPage() {
  const user = await requirePageAdmin();

  return (
    <AppShell user={user}>
      <div className="grid gap-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">Settings</h1>
          <p className="mt-2 text-base font-semibold text-slate-500">
            Configure portal security and operational preferences.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {settings.map((setting) => {
            const Icon = setting.icon;

            return (
              <section
                key={setting.title}
                className="rounded-lg border border-line bg-white p-5 shadow-panel"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eaf4ef] text-moss">
                  <Icon size={20} />
                </span>
                <h2 className="mt-4 text-lg font-bold text-ink">{setting.title}</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  {setting.description}
                </p>
              </section>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
