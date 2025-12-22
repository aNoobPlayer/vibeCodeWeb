import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MediaUploadButton } from "@/components/MediaUpload";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, RefreshCw, ShieldCheck, CalendarClock, UserCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

type ProfileData = {
  id: string;
  username: string;
  role: string;
  avatar?: string | null;
  createdAt?: string | null;
  lastLogin?: string | null;
};

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [, setLocation] = useLocation();
  const routeTarget = user?.role === "admin" ? "/admin" : "/student";
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: profile,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
  });

  const [formState, setFormState] = useState({
    username: "",
    avatar: "",
    password: "",
  });

  useEffect(() => {
    if (profile) {
      setFormState({
        username: profile.username,
        avatar: profile.avatar ?? "",
        password: "",
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }
      return data as ProfileData;
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData(["/api/profile"], updated);
      await refresh();
      setFormState({
        username: updated.username,
        avatar: updated.avatar ?? "",
        password: "",
      });
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error?.message || "Unable to save changes.",
        variant: "destructive",
      });
    },
  });

  const isSaving = mutation.isPending;
  const isDirty = useMemo(() => {
    if (!profile) return false;
    const usernameChanged = formState.username.trim() !== profile.username;
    const avatarChanged = (formState.avatar || "").trim() !== (profile.avatar || "");
    return usernameChanged || avatarChanged || !!formState.password;
  }, [formState, profile]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;

    const payload: Record<string, string> = {};
    const trimmedUsername = formState.username.trim();
    const trimmedAvatar = formState.avatar.trim();

    if (trimmedUsername && trimmedUsername !== profile.username) {
      payload.username = trimmedUsername;
    }
    if (trimmedAvatar !== (profile.avatar || "")) {
      payload.avatar = trimmedAvatar;
    }
    if (formState.password) {
      payload.password = formState.password;
    }

    if (Object.keys(payload).length === 0) {
      toast({
        title: "No changes detected",
        description: "Update a field before saving.",
      });
      return;
    }

    mutation.mutate(payload);
  };

  const formattedMeta = (value?: string | null) =>
    value ? new Date(value).toLocaleString("vi-VN") : "Chưa cập nhật";

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-success/10">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen py-10 px-4 transition-colors",
        user?.role === "admin"
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-[#9CCC65] via-[#66BB6A] to-[#1B5E20]",
      )}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 text-white">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setLocation(routeTarget)}
            className="text-white/80 hover:text-white hover:bg-white/10"
            data-testid="button-profile-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to dashboard
          </Button>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-white/80 hover:text-white hover:bg-white/10"
              data-testid="button-profile-refresh"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isFetching && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </header>

        <Card className="p-8 bg-white/95 backdrop-blur-xl border border-white/70 shadow-2xl" data-testid="card-profile-form">
          <div className="flex flex-wrap gap-6 items-center mb-8">
            <Avatar className="w-20 h-20">
              <AvatarImage src={formState.avatar} alt={formState.username} />
              <AvatarFallback>{formState.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm uppercase tracking-widest text-gray-400">Account</p>
              <h1 className="text-3xl font-semibold text-gray-900">{profile?.username}</h1>
              <p className="text-gray-500">{profile?.role === "admin" ? "Administrator" : "Student"}</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} data-testid="form-profile">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-username">Username</Label>
                <Input
                  id="profile-username"
                  data-testid="input-profile-username"
                  value={formState.username}
                  onChange={(e) => setFormState((prev) => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-avatar">Avatar</Label>
                <Input
                  id="profile-avatar"
                  type="hidden"
                  data-testid="input-profile-avatar"
                  value={formState.avatar}
                  readOnly
                />
                <div className="flex flex-wrap items-center gap-2">
                  <MediaUploadButton
                    accept="image/*"
                    endpoint="/api/profile/avatar/upload"
                    buttonText="Upload avatar"
                    dialogTitle="Upload avatar"
                    dialogDescription="Choose an image file to use as your profile photo."
                    onUploaded={(payload) => {
                      if (payload?.url) {
                        setFormState((prev) => ({ ...prev, avatar: payload.url ?? "" }));
                      }
                    }}
                  />
                  {formState.avatar?.trim() ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormState((prev) => ({ ...prev, avatar: "" }))}
                    >
                      Clear
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-gray-500">Recommended: square JPG/PNG/WebP.</p>
                {formState.avatar?.trim() ? (
                  <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Preview</p>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={formState.avatar} alt="Avatar preview" />
                        <AvatarFallback>{formState.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(formState.avatar, "_blank", "noopener,noreferrer")}
                        >
                          Open
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-password">Update password</Label>
              <Input
                id="profile-password"
                data-testid="input-profile-password"
                type="password"
                value={formState.password}
                onChange={(e) => setFormState((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Leave blank to keep current password"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-gray-500">Changes apply to both dashboards.</p>
              <Button
                type="submit"
                disabled={!isDirty || isSaving}
                className="min-w-[180px]"
                data-testid="button-profile-save"
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save changes
              </Button>
            </div>
          </form>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 bg-white/90 border-white/70 shadow-xl" data-testid="card-profile-meta">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400">Role</p>
                <p className="text-lg font-semibold text-gray-900">
                  {profile?.role === "admin" ? "Administrator" : "Student"}
                </p>
              </div>
            </div>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <p className="text-gray-400 text-xs uppercase">Account created</p>
                <p>{formattedMeta(profile?.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase">Last login</p>
                <p>{formattedMeta(profile?.lastLogin)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/90 border-white/70 shadow-xl" data-testid="card-profile-session">
            <div className="flex items-center gap-3 mb-4">
              <CalendarClock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400">Session</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.username || formState.username}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Keep your profile up to date so teachers can recognize your progress across dashboards.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              data-testid="button-profile-sync"
            >
              {isFetching && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sync latest data
            </Button>
          </Card>
        </div>

        <Card className="p-6 flex items-center gap-4 bg-white/90 border-white/70 shadow-xl" data-testid="card-profile-footer">
          <UserCircle2 className="w-10 h-10 text-primary" />
          <div className="flex-1">
            <p className="text-sm text-gray-500">
              Need to switch roles or access another class? Log out and sign in with the correct account.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setLocation(routeTarget)} data-testid="button-profile-dashboard">
            Go to dashboard
          </Button>
        </Card>
      </div>
    </div>
  );
}
