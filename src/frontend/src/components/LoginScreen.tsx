import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User } from "lucide-react";
import { useState } from "react";
import { backendApi as backend } from "../utils/backendApi";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await backend.login(username, password);
      if (success) {
        localStorage.setItem("cafe_auth", "true");
        onLogin();
      } else {
        setError("Invalid username or password");
        setIsLoading(false);
      }
    } catch {
      setError("Login failed. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <span className="text-5xl leading-none mb-1">☕</span>
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          Simple Sips Cafe
        </h2>
        <p className="text-xs text-muted-foreground text-center">
          Login to view sales reports
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-xs bg-card border border-border rounded-2xl shadow-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-full bg-cafe-amber-light flex items-center justify-center">
            <Lock className="w-4 h-4 text-cafe-espresso" />
          </div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
            Secure Login
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <Label
              htmlFor="username"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
            >
              Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                placeholder="Enter username"
                className="pl-9 h-10 text-sm"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
            >
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter password"
                className="pl-9 h-10 text-sm"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-destructive font-medium bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full h-10 bg-cafe-espresso hover:bg-cafe-espresso/90 text-white font-semibold text-sm rounded-lg mt-1"
          >
            {isLoading ? "Signing in..." : "Login"}
          </Button>
        </form>
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center opacity-60">
        Only authorized staff can view sales data
      </p>
    </div>
  );
}
