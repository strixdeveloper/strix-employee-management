//import { SignUpForm } from "@/components/sign-up-form";
import Image from "next/image";
import Link from "next/link";
import strixLogo from "../../Strix-logo-1.png";
import { Button } from "@/components/ui/button";

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
            <h1 className="text-2xl font-bold">Please Contact Admin to Sign Up</h1>
            <p className="text-sm text-muted-foreground">
              If you need to sign up, please contact the admin to get an account.
            </p>
            <Link href="/login" className="text-sm text-pink-600 hover:underline">
             Login
            </Link> 
           
          </div>
        </div>
      </div>
    </div>
  );
}
