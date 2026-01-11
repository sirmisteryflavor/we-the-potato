import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <main className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="text-8xl font-bold text-muted-foreground/20 mb-4">404</div>
      <h1 className="text-2xl font-bold mb-2" data-testid="text-not-found-title">
        Page Not Found
      </h1>
      <p className="text-muted-foreground mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button 
          variant="outline"
          onClick={() => window.history.back()}
          data-testid="button-go-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
        <Button 
          onClick={() => navigate("/")}
          data-testid="button-go-home"
        >
          <Home className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
    </main>
  );
}
