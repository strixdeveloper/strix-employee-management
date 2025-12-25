"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Camera, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password.length > 0) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileContent() {
  const [user, setUser] = React.useState<{
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const showMessage = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  React.useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error || !authUser) {
        showMessage("Failed to load user data", "error");
        setLoading(false);
        return;
      }

      const name = authUser.user_metadata?.full_name || 
                   authUser.user_metadata?.name || 
                   authUser.email?.split("@")[0] || 
                   "User";
      const avatarUrl = authUser.user_metadata?.avatar_url || null;

      setUser({
        id: authUser.id,
        email: authUser.email || "",
        name,
        avatar_url: avatarUrl,
      });

      form.reset({
        email: authUser.email || "",
        name,
        password: "",
        confirmPassword: "",
      });

      setLoading(false);
    }

    fetchUser();
  }, [form]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showMessage("Please upload an image file", "error");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage("Please upload an image smaller than 5MB", "error");
      return;
    }

    setUploading(true);
    const supabase = createClient();

    try {
      // Create or get avatars bucket
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      // Upload directly to bucket root, not in a subfolder
      const filePath = fileName;

      // Upload to Supabase Storage
      // Note: You'll need to create an 'avatars' bucket in Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        // If bucket doesn't exist or RLS policy issue, provide helpful error message
        console.error("Upload error:", uploadError);
        
        if (uploadError.message?.includes("row-level security") || uploadError.message?.includes("RLS")) {
          showMessage("Storage policy error. Please run the SQL policies from sql/setup_avatars_storage.sql in Supabase SQL Editor", "error");
        } else if (uploadError.message?.includes("Bucket not found")) {
          showMessage("Avatars bucket not found. Please create the 'avatars' bucket in Supabase Storage", "error");
        } else {
          showMessage(`Upload failed: ${uploadError.message}`, "error");
        }
        setUploading(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
      });

      if (updateError) throw updateError;

      setUser((prev) => prev ? { ...prev, avatar_url: avatarUrl } : null);
      
      showMessage("Profile picture updated successfully", "success");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      showMessage(error.message || "Failed to upload image", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setSaving(true);
    const supabase = createClient();

    try {
      const updateData: { email?: string; data?: { full_name: string } } = {};

      // Update email if changed
      if (data.email !== user?.email) {
        updateData.email = data.email;
      }

      // Update name in metadata
      if (data.name !== user?.name) {
        updateData.data = { full_name: data.name };
      }

      // Update password if provided
      if (data.password && data.password.length > 0) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.password,
        });
        if (passwordError) throw passwordError;
      }

      // Update user profile
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase.auth.updateUser(updateData);
        if (updateError) throw updateError;
      }

      // Refresh user data
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) {
        const name = updatedUser.user_metadata?.full_name || 
                     updatedUser.user_metadata?.name || 
                     updatedUser.email?.split("@")[0] || 
                     "User";
        const avatarUrl = updatedUser.user_metadata?.avatar_url || null;

        setUser({
          id: updatedUser.id,
          email: updatedUser.email || "",
          name,
          avatar_url: avatarUrl,
        });

        form.reset({
          email: updatedUser.email || "",
          name,
          password: "",
          confirmPassword: "",
        });
      }

      showMessage("Profile updated successfully", "success");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      showMessage(error.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Message Notification */}
        {message && (
          <div
            className={cn(
              "p-4 rounded-lg border flex items-center gap-3 animate-in slide-in-from-top-5",
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
            )}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}
        {/* Profile Picture Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              Upload a profile picture to personalize your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={user?.avatar_url || ""} alt={user?.name || "User"} />
                  <AvatarFallback className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-2xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Change Picture"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG or GIF. Max size 5MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your account information and email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          {...field}
                          className="max-w-md"
                        />
                      </FormControl>
                      <FormDescription>
                        Your email address is used for login and notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="John Doe"
                          {...field}
                          className="max-w-md"
                        />
                      </FormControl>
                      <FormDescription>
                        This is your display name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter new password"
                              {...field}
                              className="max-w-md"
                            />
                          </FormControl>
                          <FormDescription>
                            Leave blank if you don't want to change your password
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirm new password"
                              {...field}
                              className="max-w-md"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white shadow-lg shadow-pink-500/50 hover:shadow-xl hover:shadow-pink-500/50 transition-all duration-300"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  {form.formState.isDirty && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        form.reset({
                          email: user?.email || "",
                          name: user?.name || "",
                          password: "",
                          confirmPassword: "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

