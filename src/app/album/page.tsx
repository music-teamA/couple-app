"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Couple = {
    id: string;
    name: string;
};

export default function AlbumPage() {
    const [couples, setCouples] = useState<Couple[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const supabase = createClient();
        async function loadCouples() {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();
            if (authError || !user) {
                setLoading(false);
                return;
            }
            const { data, error } = await supabase
                .from("couple_members")
                .select("couples(id, name)")
                .eq("user_id", user.id);

            if (error) {
                console.error("アルバム取得エラー:", error.message);
                setErrorMessage("アルバムを取得できませんでした。");
            } else {
                const albums = (data ?? []).flatMap((item) => {
                    const related = item.couples;
                    if (Array.isArray(related)) {
                        return related.filter(
                            (album): album is Couple => album !== null
                        );
                    }
                    return related ? [related as Couple] : [];
                });
                setCouples(albums);
            }
            setLoading(false);
        }
        void loadCouples();
    }, []);

    return (
        <main>
            <h1>共有アルバム</h1>
            <hr />
            {loading ? (
                <p>アルバムを読み込み中...</p>
            ) : (
                <>
                    <section>
                        <Link href="/album/new">
                            <button type="button">
                                共有アルバムを作成
                            </button>
                        </Link>
                    </section>

                    <section>
                        {errorMessage && <p role="alert">{errorMessage}</p>}
                        {couples.length === 0 ? (
                            <p>まだアルバムはありません。</p>
                        ) : (
                            <ul>
                                {couples.map((couple) => (
                                    <li key={couple.id}>
                                        <Link href={`/album/${couple.id}`}>
                                            {couple.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <Link href="/join">
                            <p>招待コードで参加</p>
                        </Link>
                    </section>
                </>
            )}
        </main>
    );
}