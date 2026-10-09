import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  IconArrowRight,
  IconBalance,
  IconBoxes,
  IconCheck,
  IconFactory,
  IconPackageCheck,
  IconSpin,
  Logo,
} from "@/components/icons";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { errMsg } from "@/lib/erp";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in. JobberFlow." },
      {
        name: "description",
        content: "Sign in to manage job work BOM, inventory, production, and jobber stock.",
      },
      { property: "og:title", content: "Sign in, JobberFlow" },
      {
        property: "og:description",
        content: "Access your job work inventory and production control system.",
      },
    ],
  }),
  component: AuthPage,
});

const productionPath = [
  { label: "Receive materials", detail: "Record inward stock at your warehouse", icon: IconBoxes },
  {
    label: "Issue to jobbers",
    detail: "Track company-owned material at each unit",
    icon: IconFactory,
  },
  {
    label: "Post production",
    detail: "Apply BOM usage and voucher wastage",
    icon: IconPackageCheck,
  },
  { label: "Reconcile", detail: "Review returns, balances, and accountability", icon: IconBalance },
];

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      toast.error(errMsg(error));
      return;
    }
    await supabase.rpc("ensure_profile", fullName ? { _full_name: fullName } : {});
    void navigate({ to: "/dashboard" });
  };

  const signUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
    });
    setBusy(false);
    if (error) {
      toast.error(errMsg(error));
      return;
    }

    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.rpc("ensure_profile", { _full_name: fullName });
      void navigate({ to: "/dashboard" });
    } else {
      toast.success("Account created. Check your email to confirm, then sign in.");
    }
  };

  const google = async () => {
    setBusy(true);
    const { lovable } = await import("@/integrations/lovable/index");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/dashboard" });
  };

  return (
    <main className="min-h-dvh bg-background lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(28rem,0.75fr)]">
      <section className="relative hidden overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:flex-col xl:p-14">
        <div className="auth-grid absolute inset-0 opacity-25" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground">
            <Logo className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-sm font-bold">JobberFlow</p>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
              Operations control
            </p>
          </div>
        </div>

        <div className="relative my-auto max-w-xl py-12">
          <p className="mb-4 text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-sidebar-primary">
            BOM · Inventory · Reconciliation
          </p>
          <h2 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] xl:text-5xl">
            Every material handoff, accounted for.
          </h2>
          <p className="mt-5 max-w-lg text-pretty text-sm leading-7 text-sidebar-foreground/60">
            Follow production without losing the operating context, from warehouse receipt to jobber
            return and final reconciliation.
          </p>

          <ol className="mt-10 grid gap-px overflow-hidden border border-sidebar-border bg-sidebar-border xl:grid-cols-2">
            {productionPath.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.label} className="bg-sidebar/90 p-4">
                  <div className="flex gap-3">
                    <span className="num flex size-8 shrink-0 items-center justify-center border border-sidebar-border text-[0.6875rem] font-bold text-sidebar-primary">
                      0{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Icon className="size-4 text-sidebar-primary" aria-hidden="true" />
                        {step.label}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-sidebar-foreground/45">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <p className="relative text-xs text-sidebar-foreground/35">
          Purpose-built for accountable job work operations.
        </p>
      </section>

      <section className="flex min-h-dvh items-center justify-center px-4 py-10 sm:px-8">
        <div className="auth-stage w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center bg-primary text-primary-foreground">
              <Logo className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-sm font-bold">JobberFlow</p>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Operations control
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Secure workspace
            </p>
            {/*
              This is the page's h1, not the panel's. The marketing panel on the
              left is `hidden lg:flex`, so below `lg` the document previously
              started at an h2 with no h1 at all. One h1, always present; the
              panel keeps its own heading as an h2.
            */}
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em]">
              {mode === "signin" ? "Continue to your workspace" : "Create your workspace account"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {mode === "signin"
                ? "Enter your credentials to return to the current production flow."
                : "Set up access for your first administrator."}
            </p>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-5">
              <Tabs value={mode} onValueChange={setMode}>
                <TabsList className="mb-5 grid h-10 w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                  <form className="space-y-4" onSubmit={signIn}>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Work email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                    </div>
                    <Button type="submit" size="lg" className="w-full" disabled={busy}>
                      {busy ? (
                        <IconSpin className="size-4 animate-spin" />
                      ) : (
                        <IconArrowRight className="size-4" />
                      )}
                      {busy ? "Opening workspace…" : "Continue to dashboard"}
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="signup">
                  <form className="space-y-4" onSubmit={signUp}>
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Full name</Label>
                      <Input
                        id="name"
                        name="name"
                        autoComplete="name"
                        placeholder="Your full name"
                        required
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email2">Work email</Label>
                      <Input
                        id="email2"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="password2">Password</Label>
                      <Input
                        id="password2"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        minLength={6}
                        required
                        // The hint below is only announced with the field if
                        // the input points at it.
                        aria-describedby="password-hint"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                      <p id="password-hint" className="text-xs text-muted-foreground">
                        Use at least 6 characters.
                      </p>
                    </div>
                    <Button type="submit" size="lg" className="w-full" disabled={busy}>
                      {busy ? (
                        <IconSpin className="size-4 animate-spin" />
                      ) : (
                        <IconCheck className="size-4" />
                      )}
                      {busy ? "Creating account…" : "Create administrator account"}
                    </Button>
                    <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                      <IconCheck
                        className="mt-0.5 size-3.5 shrink-0 text-success"
                        aria-hidden="true"
                      />
                      The first account created becomes the system administrator.
                    </p>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="my-5 flex items-center gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
                or
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
              </div>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                disabled={busy}
                onClick={() => void google()}
              >
                <span className="font-display text-sm font-bold" aria-hidden="true">
                  G
                </span>
                Continue with Google
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
