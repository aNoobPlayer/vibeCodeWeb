import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center px-4">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
        </div>
        <h1 className="text-7xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-2xl text-gray-600 mb-8">Trang không tồn tại</p>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Có vẻ như bạn đã đi lạc đường. Hãy quay về trang chủ để tiếp tục hành trình học tập!
        </p>
        <Link href="/">
          <Button size="lg" data-testid="button-back-home" className="gap-2">
            <Home className="w-4 h-4" />
            Về trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}
