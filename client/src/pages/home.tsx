import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, UserCog, UserCircle, ArrowRight, TrendingUp, Layers, ClipboardList, Lightbulb, BookOpen, Headphones, Mic, PenTool, Brain, ChartLine, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-accent/10 to-success/10">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <GraduationCap className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent mb-4">
            APTIS KEYS
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Nền tảng luyện thi APTIS chuyên nghiệp với giao diện quản lý cho giáo viên và môi trường học tập tương tác cho học viên
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Admin Portal Card */}
          <Card className="p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-gradient-to-br from-gray-900 to-gray-800 text-white border-0">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                <UserCog className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Quản trị viên / Giáo viên</h2>
              <p className="text-gray-300 mb-8 leading-relaxed">
                Giao diện chuyên nghiệp với bảng điều khiển tổng quan, quản lý bộ đề thi, ngân hàng câu hỏi, mẹo học và thư viện media
              </p>
              <Link href="/admin">
                <Button
                  data-testid="button-enter-admin"
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:scale-105 transition-all gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Vào trang quản trị
                </Button>
              </Link>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" />
                  Dashboard
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium flex items-center gap-1.5">
                  <Layers className="w-3 h-3" />
                  Bộ đề thi
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium flex items-center gap-1.5">
                  <ClipboardList className="w-3 h-3" />
                  Câu hỏi
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium flex items-center gap-1.5">
                  <Lightbulb className="w-3 h-3" />
                  Mẹo học
                </div>
              </div>
            </div>
          </Card>

          {/* Student Portal Card */}
          <Card className="p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-gradient-to-br from-green-500 to-green-700 text-white border-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <UserCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Học viên</h2>
              <p className="text-white/95 mb-8 leading-relaxed">
                Giao diện học tập sinh động với hiệu ứng glassmorphic, thẻ luyện tập màu sắc và hệ thống theo dõi tiến độ
              </p>
              <Link href="/student">
                <Button
                  data-testid="button-enter-student"
                  size="lg"
                  variant="secondary"
                  className="w-full bg-white text-green-700 hover:bg-white/90 hover:shadow-lg hover:scale-105 transition-all gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Bắt đầu học tập
                </Button>
              </Link>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" />
                  Reading
                </div>
                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1.5">
                  <Headphones className="w-3 h-3" />
                  Listening
                </div>
                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1.5">
                  <Mic className="w-3 h-3" />
                  Speaking
                </div>
                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1.5">
                  <PenTool className="w-3 h-3" />
                  Writing
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-20 max-w-5xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Tính năng nổi bật
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Ngân hàng câu hỏi phong phú</h4>
              <p className="text-gray-600 text-sm">
                Hàng ngàn câu hỏi được phân loại theo kỹ năng và độ khó
              </p>
            </Card>
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ChartLine className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Theo dõi tiến độ</h4>
              <p className="text-gray-600 text-sm">
                Thống kê chi tiết về quá trình học tập và kết quả luyện tập
              </p>
            </Card>
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Mẹo & Hướng dẫn</h4>
              <p className="text-gray-600 text-sm">
                Tài liệu học tập và chiến lược làm bài hiệu quả
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
