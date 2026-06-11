import { getCurrentUser } from "@/lib/session";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { PageHeader, Card } from "@/components/ui";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <>
      <PageHeader title="My Profile" subtitle="Account details and security" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-slate-800">Account</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-800">{user.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-800">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Role</dt>
              <dd className="font-medium text-slate-800">{ROLE_LABELS[user.role as Role]}</dd>
            </div>
          </dl>
        </Card>

        <div>
          <h2 className="mb-3 font-semibold text-slate-800">Change Password</h2>
          <ChangePasswordForm />
        </div>
      </div>
    </>
  );
}
