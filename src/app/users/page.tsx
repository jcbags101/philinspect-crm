import { PageHeader } from "@/components/page-header";
import { InviteMemberForm } from "@/components/users/invite-member-form";
import { InvitationRowAction } from "@/components/users/invitation-row-action";
import { MemberEditor } from "@/components/users/member-editor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePagePermission } from "@/server/auth/page-authorization";
import { requireSessionContext } from "@/server/auth/session-context";
import { getWorkspaceInvitations, getWorkspaceMembers } from "@/server/services/member-service";

export const dynamic = "force-dynamic";
const roleLabel = (role: string) => role.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());

export default async function UsersPage() {
  const context = await requireSessionContext();
  requirePagePermission(context.role, "members:read");
  const canManage = context.role === "admin";
  const [members, invitations] = await Promise.all([
    getWorkspaceMembers(context),
    canManage ? getWorkspaceInvitations(context) : Promise.resolve([]),
  ]);
  return (
    <>
      <PageHeader title="Users" description="Manage workspace members, roles, and access." />
      {canManage && <div className="mb-6"><InviteMemberForm /></div>}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead><tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground"><th className="px-4 py-3">Member</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Joined</th>{canManage && <th className="px-4 py-3 text-right">Access</th>}</tr></thead>
            <tbody>{members.map((member) => <tr className="border-b last:border-0" key={member.id}><td className="px-4 py-3"><p className="font-medium">{member.name}{member.userId === context.userId && <span className="text-muted-foreground"> (you)</span>}</p><p className="text-xs text-muted-foreground">{member.email}</p></td><td className="px-4 py-3"><Badge variant="outline">{roleLabel(member.role)}</Badge></td><td className="px-4 py-3"><Badge variant="outline">{roleLabel(member.status)}</Badge></td><td className="px-4 py-3 text-muted-foreground">{member.createdAt.toLocaleDateString("en-PH")}</td>{canManage && <td className="px-4 py-3"><MemberEditor membershipId={member.id} role={member.role} status={member.status} /></td>}</tr>)}</tbody>
          </table>
        </div>
      </Card>
      {canManage && <Card className="mt-6 overflow-hidden p-0"><CardHeader><CardTitle>Invitations</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr className="border-y bg-muted/30 text-left text-xs text-muted-foreground"><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Expires</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody>{invitations.map((invitation) => <tr className="border-b last:border-0" key={invitation.id}><td className="px-4 py-3 font-medium">{invitation.email}</td><td className="px-4 py-3">{roleLabel(invitation.role)}</td><td className="px-4 py-3"><Badge variant="outline">{invitation.expired && invitation.status === "pending" ? "Expired" : roleLabel(invitation.status)}</Badge></td><td className="px-4 py-3 text-muted-foreground">{invitation.expiresAt.toLocaleDateString("en-PH")}</td><td className="px-4 py-3">{invitation.status === "pending" && !invitation.expired && <InvitationRowAction invitationId={invitation.id} />}</td></tr>)}{invitations.length === 0 && <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>No invitations yet.</td></tr>}</tbody></table></div></CardContent></Card>}
    </>
  );
}
