import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock, Home, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <Lock className="h-16 w-16 mx-auto text-muted-foreground/50 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8">
          You don't have permission to access this page. Your current role doesn't have the required privileges.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Sign In with Different Account
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}