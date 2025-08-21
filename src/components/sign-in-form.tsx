import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthActions } from "@convex-dev/auth/react";
import { redirect } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Separator } from "./ui/separator";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-4 items-center"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData)
            .then(() => redirect("/home"))
            .catch((error) => {
              let toastTitle = "";
              if (error.message.includes("Invalid password")) {
                toastTitle = "Invalid password. Please try again.";
              } else {
                toastTitle =
                  flow === "signIn"
                    ? "Could not sign in, did you mean to sign up?"
                    : "Could not sign up, did you mean to sign in?";
              }
              toast.error(toastTitle);
              setSubmitting(false);
            });
        }}
      >
        <Input
          type="email"
          name="email"
          placeholder="Email"
          required
          size="lg"
        />
        <Input
          type="password"
          name="password"
          placeholder="Password"
          required
          size="lg"
        />
        <Button
          className="auth-button w-full"
          size="lg"
          type="submit"
          disabled={submitting}
        >
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </Button>
        <div className="text-center text-sm text-primary">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <Button
            type="button"
            variant="link"
            className="px-2"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </Button>
        </div>
      </form>
      <div className="flex items-center justify-center my-3">
        <Separator className="shrink" />
        <span className="mx-4 text-primary">or</span>
        <Separator className="shrink" />
      </div>
      <Button
        className="auth-button w-full"
        size="lg"
        onClick={() => void signIn("anonymous")}
      >
        Sign in anonymously
      </Button>
    </div>
  );
}
