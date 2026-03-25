"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      setError("Wrong password");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <h1 className="font-[family-name:var(--font-montserrat)] text-2xl font-bold tracking-[0.15em] text-center mb-8">
          Shala Ball
        </h1>
        <p className="text-center text-xs tracking-[0.2em] uppercase text-muted mb-8">
          Gallery Admin
        </p>

        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full px-4 py-3 border border-border bg-white text-sm tracking-wide
                     outline-none focus:border-accent transition-colors"
        />

        {error && (
          <p className="text-red-600 text-xs mt-2 tracking-wide">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full mt-4 py-3 bg-accent text-white text-xs font-medium
                     tracking-[0.25em] uppercase transition-colors hover:bg-[#555]
                     disabled:opacity-40"
        >
          {loading ? "..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
