import type { Metadata } from "next";
import { AuthPage } from "@/components/forms/auth-page";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return <AuthPage mode="register" searchParams={searchParams} />;
}
