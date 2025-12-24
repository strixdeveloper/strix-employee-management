import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import strixLogo from "../../Strix-logo-1.png";

export default function Page() {
  return (
    <div className="min-h-svh w-full relative overflow-hidden">
      {/* Background gradient matching hero section */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(236,72,153,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(217,70,239,0.1),transparent_50%)]"></div>
      
      <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/">
              <Image
                src={strixLogo}
                alt="Strix Logo"
                width={150}
                height={50}
                className="h-12 w-auto"
              />
            </Link>
          </div>
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Thank you for signing up!
                </CardTitle>
                <CardDescription>Check your email to confirm</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You&apos;ve successfully signed up! Please check your email inbox (and spam folder) for a confirmation link.
                  </p>
                  <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
                    <p className="text-sm text-pink-800 dark:text-pink-200 font-medium mb-2">
                      Next Steps:
                    </p>
                    <ol className="text-xs text-pink-700 dark:text-pink-300 space-y-1 list-decimal list-inside">
                      <li>Check your email for the confirmation link</li>
                      <li>Click the link to verify your account</li>
                      <li>You&apos;ll be automatically redirected to login</li>
                    </ol>
                  </div>
                  <div className="pt-2">
                    <Link 
                      href="/auth/login" 
                      className="text-sm text-pink-600 dark:text-pink-400 hover:underline font-medium"
                    >
                      Go to Login →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
