import { FormEvent, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAdminUsers, type AdminUserSummary } from "@/features/users/hooks/useAdminUsers";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { Users, UserPlus, ShieldCheck, Loader2, Pencil, Trash2 } from "lucide-react";

export default function UsersPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUserSummary | null>(null);
  const [newUser, setNewUser] = useState<{ username: string; password: string; role: "admin" | "student" }>({
    username: "",
    password: "",
    role: "student",
  });

  const { users, isLoading } = useAdminUsers();

  const createUserMutation = useMutation<
    AdminUserSummary,
    Error,
    { username: string; password: string; role: "admin" | "student" }
  >({
    mutationFn: async (payload) => {
      const res = await apiRequest("/api/admin/users", "POST", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers() });
      toast({
        title: "Tạo tài khoản thành công",
        description: "Người dùng mới đã được thêm vào hệ thống.",
      });
      setIsCreateOpen(false);
      setNewUser({ username: "", password: "", role: "student" });
    },
    onError: (error) => {
      toast({
        title: "Không thể tạo tài khoản",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation<
    AdminUserSummary,
    Error,
    { id: string; role: "admin" | "student"; username: string }
  >({
    mutationFn: async (payload) => {
      const res = await apiRequest(`/api/admin/users/${payload.id}`, "PATCH", { role: payload.role });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers() });
      toast({
        title: "Cập nhật quyền thành công",
        description: `${variables.username} đã được chuyển sang nhóm ${
          variables.role === "admin" ? "quản trị viên" : "học viên"
        }`,
      });
    },
    onError: (error) => {
      toast({
        title: "Không thể cập nhật quyền",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation<void, Error, { id: string; username: string }>({
    mutationFn: async (payload) => {
      await apiRequest(`/api/admin/users/${payload.id}`, "DELETE");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers() });
      setUserToDelete(null);
      toast({
        title: "Đã xóa người dùng",
        description: `${variables.username} đã bị xóa khỏi hệ thống.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Không thể xóa người dùng",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users
      .filter((item) => {
        if (roleFilter !== "all" && item.role !== roleFilter) return false;
        if (searchQuery && !item.username.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return createdB - createdA;
      });
  }, [users, roleFilter, searchQuery]);

  const totalUsers = users?.length ?? 0;
  const adminCount = users?.filter((user) => user.role === "admin").length ?? 0;
  const studentCount = users?.filter((user) => user.role === "student").length ?? 0;
  const activeCount = users?.filter((user) => user.isActive !== false).length ?? 0;

  const pendingRoleUserId = updateRoleMutation.variables?.id;
  const pendingDeleteUserId = deleteUserMutation.variables?.id;

  const handleCreateUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newUser.username.trim()) {
      toast({
        title: "Tên đăng nhập không hợp lệ",
        description: "Vui lòng nhập tên đăng nhập.",
        variant: "destructive",
      });
      return;
    }
    if (newUser.password.trim().length < 6) {
      toast({
        title: "Mật khẩu quá ngắn",
        description: "Mật khẩu cần ít nhất 6 ký tự.",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const allowRoleChange = (userItem: AdminUserSummary) => {
    if (!currentUser) return true;
    return String(userItem.id) !== String(currentUser.id);
  };

  const createdAtLabel = (userItem: AdminUserSummary) =>
    userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString("vi-VN") : "-";
  const lastLoginLabel = (userItem: AdminUserSummary) =>
    userItem.lastLogin ? new Date(userItem.lastLogin).toLocaleDateString("vi-VN") : "Chưa đăng nhập";

  return (
    <div className="space-y-6 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User management</h1>
        <p className="text-gray-600">Invite admins and manage student accounts</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <Card className="flex-1 bg-gradient-to-r from-primary/10 to-primary/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/20 p-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active users</p>
                <p className="text-xl font-semibold text-gray-900">
                  {activeCount} active · {adminCount} admin · {studentCount} student
                </p>
              </div>
            </div>
          </Card>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-open-create-user">
                <UserPlus className="w-4 h-4" />
                Invite user
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm người dùng mới</DialogTitle>
                <DialogDescription>
                  Nhập thông tin tài khoản để cấp quyền truy cập vào hệ thống.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleCreateUser}>
                <div className="space-y-1">
                  <Label htmlFor="new-username">Tên đăng nhập</Label>
                  <Input
                    id="new-username"
                    value={newUser.username}
                    onChange={(event) => setNewUser((prev) => ({ ...prev, username: event.target.value }))}
                    placeholder="vd: giangvien01"
                    data-testid="input-new-username"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-password">Mật khẩu tạm</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newUser.password}
                    onChange={(event) => setNewUser((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="Tối thiểu 6 ký tự"
                    data-testid="input-new-password"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Phân quyền</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: "admin" | "student") => setNewUser((prev) => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger data-testid="select-new-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Học viên</SelectItem>
                      <SelectItem value="admin">Quản trị viên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" data-testid="button-create-user" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-2" />
                    )}
                    Tạo tài khoản
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <div className="flex gap-2 ml-auto flex-1 justify-end">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-44" data-testid="filter-user-role">
                <SelectValue placeholder="Tất cả quyền" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả quyền</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
                <SelectItem value="student">Học viên</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Tìm kiếm theo tên đăng nhập..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-56"
              data-testid="input-search-users"
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Tên đăng nhập</TableHead>
                <TableHead>Quyền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Hoạt động cuối</TableHead>
                <TableHead className="w-48 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    Đang tải danh sách người dùng...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-3" />
                    <p>Không tìm thấy người dùng phù hợp</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((userItem, index) => {
                  const createdAtLabel = userItem.createdAt
                    ? new Date(userItem.createdAt).toLocaleDateString("vi-VN")
                    : "-";
                  const lastLoginLabel = userItem.lastLogin
                    ? new Date(userItem.lastLogin).toLocaleDateString("vi-VN")
                    : "Chưa đăng nhập";
                  return (
                    <TableRow key={userItem.id} data-testid={`user-row-${userItem.id}`}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-semibold text-gray-900">{userItem.username}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs uppercase">
                          {userItem.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {userItem.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{createdAtLabel}</TableCell>
                      <TableCell className="text-sm text-gray-500">{lastLoginLabel}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={userItem.role}
                            onValueChange={(value: "admin" | "student") =>
                              updateRoleMutation.mutate({ id: String(userItem.id), role: value, username: userItem.username })
                            }
                            disabled={!allowRoleChange(userItem)}
                          >
                            <SelectTrigger className="w-32 text-xs" data-testid={`select-role-${userItem.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-delete-user-${userItem.id}`}
                            className="text-destructive"
                            disabled={pendingDeleteUserId === userItem.id || !allowRoleChange(userItem)}
                            onClick={() => setUserToDelete({ id: String(userItem.id), username: userItem.username, role: userItem.role, isActive: userItem.isActive })}
                          >
                            {pendingDeleteUserId === userItem.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => (!open ? setUserToDelete(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn tài khoản {userToDelete?.username}. Bạn không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                userToDelete && deleteUserMutation.mutate({ id: String(userToDelete.id), username: userToDelete.username })
              }
              className="bg-destructive text-white hover:bg-destructive/90"
              data-testid="confirm-delete-user"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Xóa tài khoản
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
