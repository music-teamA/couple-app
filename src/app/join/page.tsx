"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinAlbumPage() {
    const [code, setCode] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleJoin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const supabase = createClient();
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();
            if (userError || !user) {
                router.push("/login");
                return;
            }
            const { data: coupleId, error } = await supabase.rpc(
                "join_couple_by_code",
                { p_code: code.trim() }
            );
            if (error) throw error;
            if (!coupleId) throw new Error("参加先のアルバムを取得できませんでした");
            router.push(`/album/${coupleId}`);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "アルバムへの参加に失敗しました"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main>
            <h1>アルバムに参加</h1>
            <form onSubmit={handleJoin}>
                <label htmlFor="inviteCode">招待コード</label>
                <input
                    id="inviteCode"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    placeholder="招待コードを入力"
                />
                <button type="submit" disabled={loading}>
                    {loading ? "参加中..." : "アルバムに参加する"}
                </button>
            </form>
            {message && <p role="alert">{message}</p>}
        </main>
    );
}
