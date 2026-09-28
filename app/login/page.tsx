import type { Metadata } from "next";
import { AuthPage } from "@/components/forms/auth-page";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return <AuthPage mode="login" searchParams={searchParams} />;
}
