import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ConnectSupabaseSteps } from "@/components/tutorial/connect-supabase-steps";
import { SignUpUserSteps } from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import strixLogo from "./logo.png";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-gray-900 dark:bg-gray-950">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>
                <Image
                  src={strixLogo}
                  alt="Strix Logo"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
              </Link>
            </div>
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </nav>
        {/* Hero Section */}
        <section className="w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(236,72,153,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(217,70,239,0.1),transparent_50%)]"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
            <div className="flex flex-col items-center text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 mb-8">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Streamline Your Workforce Management
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                  Employee Management
                </span>
                <br />
                <span className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-pink-500 dark:from-pink-400 dark:via-fuchsia-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Made Simple
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
                Manage your team efficiently with our comprehensive employee management system. 
                Track attendance, manage profiles, and streamline HR operations all in one place.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-16">
                {hasEnvVars ? (
                  <>
                    <Button 
                      asChild 
                      size="lg" 
                      className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-pink-500/50 hover:shadow-xl hover:shadow-pink-500/50 transition-all duration-300"
                    >
                      <Link href="/auth/sign-up">Get Started Free</Link>
                    </Button>
                    <Button 
                      asChild 
                      size="lg" 
                      variant="outline"
                      className="border-2 border-gray-300 dark:border-gray-600 px-8 py-6 text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
                    >
                      <Link href="/auth/login">Sign In</Link>
                    </Button>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Please configure your environment variables to get started
                    </p>
                    <ConnectSupabaseSteps />
                  </div>
                )}
              </div>

              {/* Stats */}
           
            </div>
          </div>
        </section>

        <footer className="w-full flex items-center justify-center border-t border-t-foreground/10 mx-auto text-center text-xs gap-8 py-16 bg-gray-900 dark:bg-gray-950 text-white">
          <p>
            Powered by Strix development 2025-26
          </p>
      
        </footer>
      </div>
    </main>
  );
}
