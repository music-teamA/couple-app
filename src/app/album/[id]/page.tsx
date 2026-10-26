"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Album = {
    id: string;
    name: string;
};

export default function AlbumDetailPage() {
    return (
        <Suspense fallback={<p>アルバムを読み込み中...</p>}>
            <AlbumDetailContent />
        </Suspense>
    )
}

function AlbumDetailContent() {
    const { id } = useParams<{ id: string }>();
    const [album, setAlbum] = useState<Album | null>(null);
    const [message, setMessage] = useState("読み込み中...");
    const [inviteCode, setInviteCode] = useState<string | null>(null);

    useEffect(() => {
        async function loadAlbum() {
            const supabase = createClient();
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) {
                setMessage("ログインしてください。");
                return;
            }
            const { data, error } = await supabase
                .from("couples")
                .select("id, name")
                .eq("id", id)
                .maybeSingle();
            if (error || !data) {
                setMessage("アルバムが見つからないか、閲覧権限がありません。");
                return;
            }
            setAlbum(data);
            setMessage("");
        }
        void loadAlbum();
    }, [id]);

    // 招待コード
    async function handleInvite() {
        setMessage("");
        const supabase = createClient();
        const { data, error } = await supabase.rpc(
            "create_couple_invite",
            { p_couple_id: id }
        );

        if (error) {
            console.error(`招待コード発行エラー:${error.message}`);
            return
        }
        setInviteCode(data)
    }

    return (
        <main>
            <h1>{album?.name ?? "共有アルバム"}</h1>
            {message && <p role="status">{message}</p>}
            <section>
                <h2>パートナーを招待</h2>
                <button onClick={handleInvite}>
                    招待コードを発行する
                </button>
                {inviteCode && (
                    <div>
                        <p>このコードをパートナーに共有してください。</p>
                        <p>
                            <strong>{inviteCode}</strong>
                        </p>
                        <button
                            onClick={() => {
                                void navigator.clipboard.writeText(inviteCode);
                                setMessage("招待コードをコピーしました。");
                            }}
                        >
                            招待コードをコピー
                        </button>
                        <p>
                            パートナーは
                            <a href="/join">こちらから参加</a>
                            できます。
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}