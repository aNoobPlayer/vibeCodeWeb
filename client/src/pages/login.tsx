import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap, LogIn, Loader2, User, Lock, Sparkles, Shield, BookOpen } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 text-white">
      <div className="relative flex-1 hidden lg:flex flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/30 via-slate-900 to-slate-950 opacity-80" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="rounded-full bg-white/10 p-3">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">APTIS KEYS</p>
              <p className="text-xl font-semibold text-white">Assessment Suite</p>
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Craft smarter language assessments with confidence.
          </h1>
          <p className="text-white/70">
            One workspace for authoring, organizing, and grading Aptis-style questions. Built for content teams that move fast.
          </p>
        </div>

        <div className="relative grid gap-4">
          {[
            { icon: Sparkles, title: "Template-driven authoring", body: "Reuse curated prompts to publish in minutes." },
            { icon: Shield, title: "Role-aware access", body: "Keep admin tools gated while students focus on practice." },
            { icon: BookOpen, title: "Real-time grading", body: "Track submissions instantly with manual overrides." },
          ].map((feature) => (
            <div key={feature.title} className="flex items-start gap-3">
              <div className="rounded-full bg-white/10 p-2 mt-1">
                <feature.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{feature.title}</p>
                <p className="text-sm text-white/60">{feature.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          <Card className="border border-slate-100 shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-slate-900">Welcome back</CardTitle>
              <CardDescription className="text-slate-500">
                Sign in with your Aptis Keys credentials to access the workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-600">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="username"
                      data-testid="input-username"
                      type="text"
                      placeholder="admin@example.com"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-600">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      data-testid="input-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" data-testid="alert-error">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" data-testid="button-login" className="w-full" disabled={loading}>
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

              <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-4 bg-slate-50">
                <p className="text-sm font-semibold text-slate-700 mb-2">Demo accounts</p>
                <div className="space-y-1 text-xs text-slate-500">
                  <p><strong>Admin:</strong> admin / admin123</p>
                  <p><strong>Student:</strong> student / student123</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
