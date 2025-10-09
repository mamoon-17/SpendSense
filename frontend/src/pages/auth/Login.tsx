import React, { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  TrendingUp,
  Loader2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import heroImage from "@/assets/hero-finance.jpg";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuthStore();

  // Force light mode for auth pages
  useEffect(() => {
    const html = document.documentElement;
    const originalTheme = html.className;
    html.className = "light";

    return () => {
      html.className = originalTheme;
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Handle demo credentials
      if (
        (data.username === "john" && data.password === "demo123") ||
        (data.username === "sarah" && data.password === "demo123")
      ) {
        const demoUser = {
          id: data.username === "john" ? "1" : "2",
          name: data.username === "john" ? "John Smith" : "Sarah Johnson",
          email: `${data.username}@demo.com`,
          role: "user" as const,
          profileComplete: true,
          emailVerified: true,
          createdAt: new Date().toISOString(),
        };

        const demoToken = `demo_token_${demoUser.id}`;

        login(demoUser, demoToken);

        toast({
          title: "Welcome to the demo!",
          description: `Successfully logged in as ${demoUser.name}`,
        });

        navigate("/app/dashboard");
        return;
      }

      // Regular login
      const response = await authAPI.login({
        username: data.username,
        password: data.password,
      });
      const { user, token } = response.data;

      login(user, token);

      toast({
        title: "Welcome back!",
        description: `Successfully logged in as ${user.name}`,
      });

      navigate("/app/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description:
          error.response?.data?.message ||
          "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Background Image with Gradient */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Financial Dashboard"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-success/90" />
      </div>

      {/* Login Form */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-8">
            {/* Login Form */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Login</h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  {/* Username Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        {...register("username")}
                        type="text"
                        placeholder="Type your username"
                        className="pl-10 h-12 bg-gray-50 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.username && (
                      <p className="text-sm text-red-500">
                        {errors.username.message}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        {...register("password")}
                        type={showPassword ? "text" : "password"}
                        placeholder="Type your password"
                        className="pl-10 pr-10 h-12 bg-gray-50 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-gray-600 hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "LOGIN"
                  )}
                </Button>

                {/* Demo Credentials */}
                <div className="border-t pt-6">
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Try the demo with these credentials:
                    </p>
                    <div className="space-y-2 text-left">
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-xs text-gray-500 mb-1">
                          Demo User 1:
                        </p>
                        <p className="text-sm font-mono">john / demo123</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-xs text-gray-500 mb-1">
                          Demo User 2:
                        </p>
                        <p className="text-sm font-mono">sarah / demo123</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sign Up Link */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Don't have an account?
                  </p>
                  <Link
                    to="/register"
                    className="text-sm text-gray-600 hover:text-primary font-medium transition-colors uppercase"
                  >
                    SIGN UP
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
