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
  AlertCircle,
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
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuthStore();

  // Track loading time for cold start messaging
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setLoadingTime(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Force light mode for auth pages
  useEffect(() => {
    document.title = "Login - SpendSense";
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
      console.log("Login error:", error);
      console.log("Error response:", error.response);
      console.log("Error data:", error.response?.data);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Please check your credentials and try again.";

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-white"
      style={{ colorScheme: "light" }}
    >
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
                        className="pl-10 h-12 bg-gray-50 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 placeholder:text-gray-500"
                        disabled={isLoading}
                        style={{ color: "#111827" }}
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
                        className="pl-10 pr-10 h-12 bg-gray-50 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 placeholder:text-gray-500"
                        disabled={isLoading}
                        style={{ color: "#111827" }}
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

                {/* Login Button */}
                <div className="space-y-2">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Logging in...</span>
                      </div>
                    ) : (
                      "LOGIN"
                    )}
                  </Button>
                  {isLoading && loadingTime >= 5 && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Server is waking up (free tier). This may take up to 30
                        seconds on first request...
                      </span>
                    </div>
                  )}
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
