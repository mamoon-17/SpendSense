import React, { useState, useEffect } from "react";
import {
  User,
  Bell,
  Shield,
  Palette,
  Bot,
  CreditCard,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/components/layout/ThemeProvider";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authAPI, userProfilesAPI } from "@/lib/api";

export const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Settings - SpendSense";
  }, []);

  // Load user profile settings
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) return;

      try {
        setIsLoadingProfile(true);
        const response = await userProfilesAPI.getUserProfileByUserId(user.id);
        const userProfile = response.data;

        if (userProfile) {
          setUserProfileId(userProfile.id);
          setProfile((prev) => ({
            ...prev,
            currency: userProfile.currency || "USD",
            dateFormat: userProfile.date_format || "MM/DD/YYYY",
          }));

          // Initialize notifications from server preferences
          const prefs = (userProfile.preferences || {}) as Record<
            string,
            boolean
          >;
          setNotifications((prev) => ({
            budgetAlerts: prefs.budgetAlerts ?? prev.budgetAlerts,
            expenseReminders: prefs.expenseReminders ?? prev.expenseReminders,
            weeklyReports: prefs.weeklyReports ?? prev.weeklyReports,
            monthlyReports: prefs.monthlyReports ?? prev.monthlyReports,
            collaboratorActivity:
              prefs.collaboratorActivity ?? prev.collaboratorActivity,
          }));

          // Store in localStorage for global use
          localStorage.setItem(
            "userSettings",
            JSON.stringify({
              currency: userProfile.currency || "USD",
              dateFormat: userProfile.date_format || "MM/DD/YYYY",
            })
          );
        }
      } catch (error) {
        console.error("Failed to load user profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, [user?.id]);

  // Profile settings
  const [profile, setProfile] = useState({
    name: user?.name || "",
    avatar: "",
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    expenseReminders: false,
    weeklyReports: true,
    monthlyReports: true,
    collaboratorActivity: true,
  });

  const queryClient = useQueryClient();

  const updatePreferencesMutation = useMutation({
    mutationFn: async (prefs: Record<string, boolean>) => {
      if (!userProfileId) {
        const createResponse = await userProfilesAPI.createUserProfile({
          user_id: user?.id,
          currency: profile.currency,
          date_format: profile.dateFormat,
        });
        setUserProfileId(createResponse.data.id);
        return userProfilesAPI.updateUserPreferences(
          createResponse.data.id,
          prefs
        );
      }
      return userProfilesAPI.updateUserPreferences(userProfileId, prefs);
    },
    onSuccess: () => {
      toast({
        title: "Preferences updated",
        description: "Notification settings saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["user-profile", user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update",
        description:
          error?.response?.data?.message ||
          "Could not save notification preferences.",
        variant: "destructive",
      });
    },
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Removed AI Assistant settings

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      if (!userProfileId) {
        // Create new user profile if it doesn't exist
        const createResponse = await userProfilesAPI.createUserProfile({
          user_id: user?.id,
          currency: profile.currency,
          date_format: profile.dateFormat,
        });
        setUserProfileId(createResponse.data.id);
      } else {
        // Update existing user profile
        await userProfilesAPI.updateUserProfile(userProfileId, {
          currency: profile.currency,
          date_format: profile.dateFormat,
        });
      }

      // Store in localStorage for global use
      localStorage.setItem(
        "userSettings",
        JSON.stringify({
          currency: profile.currency,
          dateFormat: profile.dateFormat,
        })
      );

      // Dispatch custom event to notify other components
      window.dispatchEvent(
        new CustomEvent("userSettingsChanged", {
          detail: {
            currency: profile.currency,
            dateFormat: profile.dateFormat,
          },
        })
      );

      toast({
        title: "Profile updated",
        description:
          "Your settings have been saved successfully. Changes will be applied throughout the app.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validate passwords
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Call API to change password
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    toast({
      title: "Export started",
      description: "Your data export will be ready in a few minutes.",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account deletion",
      description: "This feature requires additional confirmation.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and application settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Data
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="card-financial">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="text-lg">
                    {profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Profile Picture</Label>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Upload New
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select
                    value={profile.currency}
                    onValueChange={(value) =>
                      setProfile({ ...profile, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="PKR">PKR (Rs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={profile.dateFormat}
                    onValueChange={(value) =>
                      setProfile({ ...profile, dateFormat: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="card-financial">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium capitalize">
                        {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {getNotificationDescription(key)}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => {
                        const next = {
                          ...notifications,
                          [key]: checked,
                        } as Record<string, boolean>;
                        setNotifications(next);
                        updatePreferencesMutation.mutate(next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="card-financial">
            <CardHeader>
              <CardTitle>Security & Privacy</CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <h4 className="text-sm font-medium mb-4">Change Password</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm new password"
                  />
                </div>
                <Button onClick={handlePasswordChange} disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Assistant Settings */}
        {/* Data Settings */}
        <TabsContent value="data" className="space-y-6">
          <Card className="card-financial">
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export your data or manage your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Export Your Data</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Download all your financial data including budgets,
                    expenses, and reports.
                  </p>
                  <Button onClick={handleExportData} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data (CSV)
                  </Button>
                </div>

                <div className="p-4 bg-destructive-light rounded-lg border border-destructive/20">
                  <h4 className="text-sm font-medium mb-2 text-destructive">
                    Danger Zone
                  </h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p>
                  <Button onClick={handleDeleteAccount} variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper functions
const getNotificationDescription = (key: string) => {
  const descriptions: Record<string, string> = {
    budgetAlerts: "Get notified when you exceed budget limits",
    expenseReminders: "Receive reminders to log your expenses",
    weeklyReports: "Get weekly spending summaries",
    monthlyReports: "Receive monthly financial reports",
    collaboratorActivity: "Get notified of collaborator changes",
  };
  return descriptions[key] || "";
};
