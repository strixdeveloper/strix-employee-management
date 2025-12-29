"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Copy, RefreshCw, Upload, User, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Employee {
  rowid: number;
  name: string;
  employee_id: string;
  email: string;
  designation: string;
  department: string;
}

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSuccess?: () => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: CreateUserDialogProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate secure password (avoiding characters that might cause encoding issues)
  const generatePassword = () => {
    const length = 16;
    // Using safer special characters that are less likely to cause encoding issues
    // Removed: & (ampersand) as it can cause URL encoding issues
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^*";
    let generatedPassword = "";
    for (let i = 0; i < length; i++) {
      generatedPassword += charset.charAt(
        Math.floor(Math.random() * charset.length)
      );
    }
    setPassword(generatedPassword);
  };

  // Copy password to clipboard
  const copyPassword = async () => {
    if (password) {
      await navigator.clipboard.writeText(password);
      // You can add a toast notification here
    }
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  // Reset form when dialog opens/closes
  const resetForm = () => {
    setUsername(employee?.email?.split("@")[0] || "");
    setPassword("");
    setAvatarFile(null);
    setAvatarPreview(null);
    setError(null);
    setSuccess(false);
    setCreatedPassword("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Initialize form when employee changes
  useEffect(() => {
    if (employee && open) {
      resetForm();
      // Auto-generate password on open, but user can change it
      generatePassword();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee, open]);

  const handleSubmit = async () => {
    if (!employee) return;

    // Validate password before submitting
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    // Check for common issues
    if (password.trim().length !== password.length) {
      // Password has leading/trailing spaces - warn but allow
      console.warn("Password has leading/trailing spaces - this might cause login issues");
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // First, upload avatar if provided
      let avatarUrl = null;
      if (avatarFile) {
        const supabase = createClient();
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${employee.employee_id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);
        avatarUrl = publicUrl;
      }

      // Create user via API
      // Ensure password is sent as plain string without any encoding
      const response = await fetch("/api/auth/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: employee.email,
          password: password, // Send password as-is, no encoding
          username: username || employee.email.split("@")[0],
          first_name: employee.name.split(" ")[0] || employee.name,
          avatar_url: avatarUrl,
          employee_id: employee.employee_id,
          role: "employee",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || data.details || "Failed to create user";
        throw new Error(errorMessage);
      }

      // Store password temporarily to show in success message
      setCreatedPassword(password);
      setSuccess(true);
      
      // Show success message with password for longer (5 seconds instead of 2)
      setTimeout(() => {
        onOpenChange(false);
        if (onSuccess) onSuccess();
        resetForm();
      }, 5000);
    } catch (err: any) {
      setError(err.message || "Failed to create user account");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-fuchsia-600 bg-clip-text text-transparent flex items-center gap-2">
            <Shield className="h-6 w-6 text-pink-600" />
            Create User Account
          </DialogTitle>
          <DialogDescription>
            Create an authentication account for {employee.name} ({employee.employee_id})
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                User Account Created Successfully!
              </h3>
              <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Login Credentials:
                </p>
                <div className="text-left space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">Email:</span> {employee.email}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex-1">
                      <span className="font-semibold">Password:</span>{" "}
                      <span className="font-mono bg-white dark:bg-gray-900 px-2 py-1 rounded border">
                        {createdPassword || password}
                      </span>
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const pwd = createdPassword || password;
                        if (pwd) {
                          navigator.clipboard.writeText(pwd);
                        }
                      }}
                      title="Copy Password"
                      className="h-7 w-7"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-semibold">
                  ⚠️ Please save these credentials. The password will not be shown again.
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                The user can now login with the email and password shown above.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4">
              <Label className="text-sm font-semibold">Profile Picture</Label>
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-gray-200 dark:border-gray-700">
                  <AvatarImage src={avatarPreview || undefined} alt={employee.name} />
                  <AvatarFallback className="bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white text-2xl">
                    {employee.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full border-2 border-white dark:border-gray-900 bg-white dark:bg-gray-800"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Click the upload icon to add a profile picture (optional)
              </p>
            </div>

            {/* First Name (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={employee.name.split(" ")[0] || employee.name}
                disabled
                className="bg-gray-50 dark:bg-gray-800"
              />
              <p className="text-xs text-muted-foreground">
                This field is automatically filled from employee data
              </p>
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={employee.email}
                disabled
                className="bg-gray-50 dark:bg-gray-800"
              />
              <p className="text-xs text-muted-foreground">
                This email will be used for login
              </p>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={employee.email.split("@")[0]}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Default: {employee.email.split("@")[0]}
              </p>
            </div>

            {/* Password Field - Manual or Auto-generated */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generatePassword}
                  className="text-xs h-7"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Generate
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="text"
                  value={password}
                  onChange={(e) => {
                    // Don't trim password - user might want leading/trailing spaces
                    // But we'll validate it's not just whitespace
                    setPassword(e.target.value);
                  }}
                  placeholder="Enter password manually or click Generate"
                  className="flex-1 font-mono"
                  minLength={8}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyPassword}
                  title="Copy Password"
                  disabled={!password}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a password manually (minimum 8 characters) or click Generate for a secure random password.
              </p>
            </div>

            {/* Role Info */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Default Role: Employee
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    This user will be created with employee role and can access the employee portal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {success ? (
            <Button onClick={() => {
              onOpenChange(false);
              resetForm();
            }}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !password || password.length < 8}
                className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white"
              >
                {isSubmitting ? "Creating..." : "Create User Account"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

