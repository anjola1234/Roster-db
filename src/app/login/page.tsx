import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = { title: "Log In — IndexOne" };

export default function LoginPage() {
  return (
    <main>
      <LoginForm />
    </main>
  );
}
