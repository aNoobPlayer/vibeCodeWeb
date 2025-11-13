import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap, LogIn, Loader2, User, Lock, Sparkles, Shield, BookOpen, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

const featureHighlights = [
  {
    icon: Sparkles,
    title: "Template-driven authoring",
    body: "Reuse curated prompts and ready-made blueprints to publish in minutes.",
  },
  {
    icon: Shield,
    title: "Role-aware access",
    body: "Keep admin tools gated while learners stay focused on practice flows.",
  },
  {
    icon: BookOpen,
    title: "Real-time grading",
    body: "Track submissions instantly with manual overrides and audit notes.",
  },
];

const statHighlights = [
  {
    label: "Teams onboarded",
    value: "42+",
    detail: "Universities & ELT orgs using Aptis Keys weekly.",
  },
  {
    label: "Prep time saved",
    value: "68%",
    detail: "Average reduction per test set launch.",
  },
  {
    label: "Service uptime",
    value: "99.9%",
    detail: "Backed by multi-region safeguarding.",
  },
];

const floatingAuras = [
  { className: "bg-primary/30", style: { top: "-15%", right: "-8%" }, duration: 18 },
  { className: "bg-fuchsia-500/20", style: { bottom: "-20%", left: "-10%" }, duration: 24 },
  { className: "bg-emerald-400/15", style: { bottom: "12%", right: "12%" }, duration: 22 },
];

type FocusField = "username" | "password" | null;

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<FocusField>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_rgba(2,6,23,1))]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.65),rgba(2,6,23,0.9))]"
        aria-hidden="true"
      />
      {floatingAuras.map((aura, index) => (
        <motion.span
          key={`aura-${index}`}
          className={cn("pointer-events-none absolute blur-[180px]", aura.className)}
          style={aura.style}
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: aura.duration, repeat: Infinity, repeatType: "reverse" }}
          aria-hidden="true"
        />
      ))}

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <section className="flex flex-1 flex-col justify-between px-6 py-12 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl space-y-10"
          >
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-[0.65rem] font-semibold tracking-[0.4em] text-white/70">
                <Sparkles className="h-4 w-4 text-primary" />
                APTIS KEYS
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <GraduationCap className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-white/50">Assessment Suite</p>
                    <p className="text-lg font-semibold text-white/90">Craft smarter language exams with confidence.</p>
                  </div>
                </div>
                <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                  Author, launch, and grade Aptis-style tests in one calm workspace.
                </h1>
                <p className="text-lg text-white/70">
                  Everything you need to orchestrate English proficiency programs: templates, media, grading, and clean
                  analytics wrapped in a single login.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {featureHighlights.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="flex items-start gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index + 0.1 }}
                >
                  <div className="rounded-2xl bg-white/10 p-3 text-primary shadow-inner">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">{feature.title}</p>
                    <p className="text-sm text-white/70">{feature.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {statHighlights.map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 * idx + 0.2 }}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm backdrop-blur"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">{stat.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                    <p className="mt-1 text-white/70">{stat.detail}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-6 backdrop-blur"
              >
                <Quote className="h-6 w-6 text-primary" />
                <p className="mt-4 text-lg italic text-white/90">
                  "Our content team ships a new speaking exam every week. The workflow feels delightful instead of daunting."
                </p>
                <p className="mt-3 text-sm text-white/70">Academic Director, Express English Lab</p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        <section className="flex flex-1 items-center justify-center px-6 py-16 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative w-full max-w-md"
          >
            <div
              className="absolute inset-0 -z-10 rounded-[32px] bg-gradient-to-br from-primary/25 via-fuchsia-500/20 to-transparent blur-3xl opacity-80"
              aria-hidden="true"
            />
            <Card className="relative overflow-hidden border border-white/10 bg-white/95 text-slate-900 shadow-[0_30px_60px_rgba(2,6,23,0.45)] backdrop-blur">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/10 to-transparent" aria-hidden="true" />
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Status: All systems stable
                  </div>
                  <Shield className="h-5 w-5 text-slate-400" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-bold text-slate-900">Welcome back</CardTitle>
                  <CardDescription className="text-base text-slate-500">
                    Sign in to orchestrate authoring, media, and grading in a single flow.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-slate-600">
                      Username
                    </Label>
                    <div
                      className={cn(
                        "relative rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-1.5 shadow-sm transition focus-within:bg-white",
                        focusedField === "username" && "border-primary/50 shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                      )}
                    >
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="username"
                        data-testid="input-username"
                        type="text"
                        placeholder="admin@example.com"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onFocus={() => setFocusedField("username")}
                        onBlur={() => setFocusedField(null)}
                        className="border-none bg-transparent pl-10 text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400"
                        disabled={loading}
                        autoComplete="username"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-600">
                      Password
                    </Label>
                    <div
                      className={cn(
                        "relative rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-1.5 shadow-sm transition focus-within:bg-white",
                        focusedField === "password" && "border-primary/50 shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                      )}
                    >
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="password"
                        data-testid="input-password"
                        type="password"
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        className="border-none bg-transparent pl-10 text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400"
                        disabled={loading}
                        autoComplete="current-password"
                        required
                      />
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        key={error}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                      >
                        <Alert variant="destructive" data-testid="alert-error">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    data-testid="button-login"
                    className="w-full rounded-2xl bg-gradient-to-r from-primary via-indigo-500 to-blue-500 py-6 text-base font-semibold shadow-lg shadow-primary/30 transition hover:translate-y-0.5 hover:shadow-primary/40"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign in
                      </>
                    )}
                  </Button>
                </form>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600"
                >
                  <p className="font-semibold text-slate-800">Demo accounts</p>
                  <div className="mt-2 space-y-1 text-xs">
                    <p>
                      <strong>Admin:</strong> admin / admin123
                    </p>
                    <p>
                      <strong>Student:</strong> student / student123
                    </p>
                  </div>
                </motion.div>

                <p className="text-center text-xs text-slate-500">
                  Need access help? <a href="mailto:support@aptiskeys.com" className="font-semibold text-primary">Contact support</a>.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
