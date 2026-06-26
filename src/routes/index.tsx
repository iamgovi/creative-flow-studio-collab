import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { useSession } from "@/stores/session";
import type { AppRole } from "@/types/auth";
import logoDark from "@/assets/logo.png";
import logoLight from "@/assets/logo-light.png";

export const Route = createFileRoute("/")({ component: Login });

const HOME: Record<AppRole, string> = {
  employee: "/employee/dashboard",
  manager: "/manager/dashboard",
  admin: "/admin/dashboard",
};

function Login() {
  const navigate = useNavigate();
  const status = useSession((s) => s.status);
  const role = useSession((s) => s.role);
  const setAuthenticated = useSession((s) => s.setAuthenticated);
  const setError = useSession((s) => s.setError);

  const [email, setEmail] = useState("maya@wwems.co");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && role) {
      navigate({ to: HOME[role], params: {} as never, search: {} as never, replace: true });
    }
  }, [navigate, role, status]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const sessionUser = await authService.signIn(email.trim(), password);
      setAuthenticated(sessionUser);
      navigate({ to: HOME[sessionUser.role], params: {} as never, search: {} as never, replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";
      setError(message);
      toast.error("Sign in failed", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/8),transparent_60%)]">
      <Card className="w-full max-w-md p-8 shadow-sm animate-card-rise">
        <div className="flex items-center justify-center mb-6">
          <div className="rounded-full p-2 animate-logo-glow">
            <img src={logoLight} alt="cntrlm" className="h-20 w-auto object-contain block dark:hidden animate-logo-in" />
            <img src={logoDark} alt="cntrlm" className="h-20 w-auto object-contain hidden dark:block animate-logo-in" />
          </div>
        </div>

        <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your workspace.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@wwems.co"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pwd">Password</Label>
            <Input
              id="pwd"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting || status === "loading"}>
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
