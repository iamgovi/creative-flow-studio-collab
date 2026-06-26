import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRoles } from "@/stores/roles";
import { JOB_ROLES, type JobRole } from "@/types/employees";

export const Route = createFileRoute("/admin/employees/roles_/new")({
  component: InviteTeamMember,
});

type InviteForm = {
  fullName: string;
  email: string;
  temporaryPassword: string;
  jobRole: JobRole | "";
  description: string;
};

type InviteErrors = Partial<Record<keyof InviteForm, string>>;

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialForm: InviteForm = {
  fullName: "",
  email: "",
  temporaryPassword: "",
  jobRole: "",
  description: "",
};

function validateInviteForm(form: InviteForm): InviteErrors {
  const errors: InviteErrors = {};

  if (!form.fullName.trim()) errors.fullName = "Full name is required";
  if (!form.email.trim()) {
    errors.email = "Email address is required";
  } else if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = "Enter a valid email address";
  }
  if (!form.temporaryPassword) {
    errors.temporaryPassword = "Temporary password is required";
  } else if (form.temporaryPassword.length < MIN_PASSWORD_LENGTH) {
    errors.temporaryPassword = `Use at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (!form.jobRole) errors.jobRole = "Role is required";

  return errors;
}

function InviteTeamMember() {
  const navigate = useNavigate();
  const inviteMember = useRoles((state) => state.inviteMember);
  const [form, setForm] = useState<InviteForm>(initialForm);
  const [errors, setErrors] = useState<InviteErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setField = <Key extends keyof InviteForm>(field: Key, value: InviteForm[Key]) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (submitted || errors[field]) setErrors(validateInviteForm(next));
  };

  const handleSubmit = async () => {
    const nextErrors = validateInviteForm(form);
    setSubmitted(true);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;
    if (!form.jobRole) return;

    setSubmitting(true);
    try {
      await inviteMember({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.temporaryPassword,
        jobRole: form.jobRole,
      });
      toast.success("Team member invited", {
        description: `${form.fullName.trim()} is now available in Employees.`,
      });
      navigate({ to: "/admin/employees/roles" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to invite team member.";
      toast.error("Invite failed", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (field: keyof InviteForm) => errors[field];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link to="/admin/employees/roles">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold truncate">Invite Team Member</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/admin/employees/roles">Cancel</Link>
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Inviting..." : "Invite Member"}
          </Button>
        </div>
      </div>

      <Card className="p-5 space-y-4">
        <div>
          <Label htmlFor="team-member-full-name" className="text-sm">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="team-member-full-name"
            value={form.fullName}
            onChange={(event) => setField("fullName", event.target.value)}
            className="mt-1.5"
            placeholder="e.g., Maya Sharma"
            aria-invalid={Boolean(fieldError("fullName"))}
          />
          <div className="mt-1 min-h-4 text-xs text-destructive">{fieldError("fullName")}</div>
        </div>

        <div>
          <Label htmlFor="team-member-email" className="text-sm">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="team-member-email"
            type="email"
            value={form.email}
            onChange={(event) => setField("email", event.target.value)}
            className="mt-1.5"
            placeholder="maya@example.com"
            aria-invalid={Boolean(fieldError("email"))}
          />
          <div className="mt-1 min-h-4 text-xs text-destructive">{fieldError("email")}</div>
        </div>

        <div>
          <Label htmlFor="team-member-temporary-password" className="text-sm">
            Temporary Password <span className="text-destructive">*</span>
          </Label>
          <Input
            id="team-member-temporary-password"
            type="password"
            value={form.temporaryPassword}
            onChange={(event) => setField("temporaryPassword", event.target.value)}
            className="mt-1.5"
            placeholder="Minimum 8 characters"
            aria-invalid={Boolean(fieldError("temporaryPassword"))}
          />
          <div className="mt-1 min-h-4 text-xs text-destructive">
            {fieldError("temporaryPassword")}
          </div>
        </div>

        <div>
          <Label className="text-sm">
            Role <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.jobRole || undefined}
            onValueChange={(value) => setField("jobRole", value as JobRole)}
          >
            <SelectTrigger className="mt-1.5" aria-invalid={Boolean(fieldError("jobRole"))}>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {JOB_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-1 min-h-4 text-xs text-destructive">{fieldError("jobRole")}</div>
        </div>

        <div>
          <Label htmlFor="team-member-description" className="text-sm">
            Description
          </Label>
          <Textarea
            id="team-member-description"
            value={form.description}
            onChange={(event) => setField("description", event.target.value)}
            className="mt-1.5"
            placeholder="Optional notes about this team member's responsibilities."
          />
        </div>
      </Card>
    </div>
  );
}
