import { Link, useLocation, Outlet } from "react-router-dom";
import { BookOpen, BarChart2, Target, Calendar, Home, GraduationCap, Menu, X, GitCompare, Lightbulb } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
{ path: "/", label: "Tổng quan", icon: Home },
{ path: "/mon-hoc", label: "Môn học", icon: BookOpen },
{ path: "/diem-so", label: "Nhập điểm", icon: GraduationCap },
{ path: "/lich-kiem-tra", label: "Lịch kiểm tra", icon: Calendar },
{ path: "/muc-tieu", label: "Mục tiêu", icon: Target },
{ path: "/bao-cao", label: "Báo cáo & Biểu đồ", icon: BarChart2 },
{ path: "/so-sanh", label: "So sánh học kỳ", icon: GitCompare },
{ path: "/lo-trinh", label: "Lộ trình gợi ý", icon: Lightbulb }];


export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex font-inter">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border fixed h-full z-20">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-sm leading-tight">Nguyễn Bá Minh Tuấn.</h1>
              <p className="text-xs text-muted-foreground">Học tập thông minh</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) =>
          <Link
            key={path}
            to={path}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              location.pathname === path ?
              "bg-primary text-primary-foreground shadow-sm" :
              "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}>
            
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">© 2026 Quản Lý Điểm Số</p>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-card border-b border-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm">Quản Lý Điểm</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-secondary">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile menu */}
      {mobileOpen &&
      <div className="md:hidden fixed inset-0 z-20 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <nav className="absolute top-14 left-0 right-0 bg-card border-b border-border p-4 space-y-1">
            {navItems.map(({ path, label, icon: Icon }) =>
          <Link
            key={path}
            to={path}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              location.pathname === path ?
              "bg-primary text-primary-foreground" :
              "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}>
            
                <Icon className="w-4 h-4" />
                {label}
              </Link>
          )}
          </nav>
        </div>
      }

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 min-h-screen">
        <div className="p-4 md:p-6 max-w-6xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>);

}