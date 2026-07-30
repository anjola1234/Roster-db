import type { Metadata } from "next";
import SignupForm from "@/components/SignupForm";

export const metadata: Metadata = { title: "Sign Up — IndexOne" };

export default function SignupPage() {
  return (
    <main>
      <SignupForm />
    </main>
  );
}
