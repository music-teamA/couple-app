"use client";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CreateMemories from "@/components/CreateMemories/page";

type Album = {
    id: string;
    name: string;
};

type AlbumPost = {
    id: string;
    user_id: string;
    message: string;
    image_path: string | null;
    created_at: string;
};

type DisplayPost = AlbumPost & {
    imageUrl: string | null;
};

export default function AlbumDetailPage() {
    return (
        <Suspense fallback={<p>アルバムを読み込み中...</p>}>
            <AlbumDetailContent />
        </Suspense>
    );
}
function AlbumDetailContent() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const [album, setAlbum] = useState<Album | null>(null);
    const [posts, setPosts] = useState<DisplayPost[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [message, setMessage] = useState("読み込み中...");
    const [inviteCode, setInviteCode] = useState<string | null>(null);

    const loadPosts = useCallback(async () => {
        const supabase = createClient();

        const { data, error } = await supabase
            .from("album_posts")
            .select("id, user_id, message, image_path, created_at")
            .eq("couple_id", id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("投稿取得エラー:", error.message);
            setMessage(`投稿を取得できませんでした: ${error.message}`);
            return;
        }
        const displayPosts: DisplayPost[] = await Promise.all(
            (data ?? []).map(async (post) => {
                let imageUrl: string | null = null;
                if (post.image_path) {
                    const { data: signedData, error: signedError } =
                        await supabase.storage
                            .from("album-photos")
                            .createSignedUrl(post.image_path, 3600);
                    if (signedError) {
                        console.error(
                            "写真URL取得エラー:",
                            signedError.message
                        );
                    } else {
                        imageUrl = signedData.signedUrl;
                    }
                }
                return { ...post, imageUrl };
            })
        );
        // 取得した投稿を画面に反映する
        setPosts(displayPosts);
        setMessage("");
    }, [id]);

    useEffect(() => {
        let cancelled = false;
        async function loadAlbum() {
            const supabase = createClient();
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();
            if (cancelled) return;
            if (authError || !user) {
                setMessage("ログインしてください。");
                return;
            }
            setUserId(user.id);
            const { data, error } = await supabase
                .from("couples")
                .select("id, name")
                .eq("id", id)
                .maybeSingle();
            if (cancelled) return;
            if (error || !data) {
                setMessage("アルバムが見つからないか、閲覧権限がありません。");
                return;
            }
            setAlbum(data);
            setMessage("");
            await loadPosts();
        }
        void loadAlbum();
        return () => {
            cancelled = true;
        };
    }, [id, loadPosts]);

    async function handleInvite() {
        setMessage("");
        const supabase = createClient();
        const { data, error } = await supabase.rpc(
            "create_couple_invite",
            { p_couple_id: id }
        );
        if (error) {
            console.error("招待コード発行エラー:", error.message);
            setMessage(`招待コードを発行できませんでした: ${error.message}`);
            return;
        }
        setInviteCode(data);
    }


    return (
        <main>
            <p>
                <Link href="/">← トップページへ戻る</Link>
            </p>
            <h1>{album?.name ?? "共有アルバム"}</h1>
            {message && <p role="status">{message}</p>}
            <section>
                <h2>パートナーを招待</h2>
                <button type="button" onClick={handleInvite}>
                    招待コードを発行する
                </button>
                {inviteCode && (
                    <div>
                        <p>このコードをパートナーに共有してください。</p>
                        <p>
                            <strong>{inviteCode}</strong>
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                void navigator.clipboard
                                    .writeText(inviteCode)
                                    .then(() => setMessage("招待コードをコピーしました。"))
                                    .catch(() => setMessage("コピーできませんでした。コードを手動でコピーしてください。"));
                            }}
                        >
                            招待コードをコピー
                        </button>
                        <p>
                            <Link href="/join">招待コードで参加する</Link>
                        </p>
                    </div>
                )}
            </section>
            <hr />
            {album && userId && (
                <CreateMemories
                    coupleId={id}
                    userId={userId}
                    onPosted={loadPosts}
                />
            )}
            <hr />
            <section>
                <h2>みんなの思い出</h2>
                {posts.length === 0 ? (
                    <p>まだ投稿はありません。最初の思い出を投稿しましょう！</p>
                ) : (
                    <ul>
                        {posts.map((post) => (
                            <li key={post.id}>
                                <p>
                                    {new Date(post.created_at).toLocaleString("ja-JP")}
                                </p>
                                {post.message && (
                                    <p style={{ whiteSpace: "pre-wrap" }}>
                                        {post.message}
                                    </p>
                                )}
                                {post.imageUrl && (
                                    <Image
                                        src={post.imageUrl}
                                        alt="共有アルバムの写真"
                                        width={100}
                                        height={50}
                                        sizes="(max-width: 440px) 100vw, 400px"
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            maxWidth: "400px",
                                            height: "auto",
                                            borderRadius: "8px",
                                        }}
                                    />)}
                                <p>
                                    {post.user_id === userId ? "あなたの投稿" : "パートナーの投稿"}
                                </p>
                                <hr />
                            </li>
                        ))}
                    </ul>
                )}
                <button type="button" onClick={() => void loadPosts()}>
                    投稿を再読み込み
                </button>
            </section>
        </main>
    );
}
