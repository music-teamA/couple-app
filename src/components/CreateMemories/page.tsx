"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PostFormProps = {
    coupleId: string;
    userId: string;
    onPosted: () => Promise<void>;
};

export default function CreateMemories({
    coupleId,
    userId,
    onPosted,
}: PostFormProps) {
    const [postMessage, setPostMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState("");

    async function handlePost(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const trimmedMessage = postMessage.trim();
        if (!trimmedMessage && !selectedFile) {
            setStatus("メッセージか写真を入力してください。");
            return;
        }
        if (selectedFile && !selectedFile.type.startsWith("image/")) {
            setStatus("画像ファイルを選択してください。");
            return;
        }
        if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
            setStatus("写真は5MB以下のファイルを選択してください。");
            return;
        }

        setSaving(true);
        setStatus("");

        const supabase = createClient();
        let imagePath: string | null = null;

        try {
            // 写真をSupabase Storageにアップロード
            if (selectedFile) {
                const safeFileName = selectedFile.name.replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );

                imagePath = `${coupleId}/${userId}/${crypto.randomUUID()}-${safeFileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("album-photos")
                    .upload(imagePath, selectedFile, {
                        contentType: selectedFile.type,
                        upsert: false,
                    });

                if (uploadError) throw uploadError;
            }

            // 投稿データを登録
            const { error: insertError } = await supabase
                .from("album_posts")
                .insert({
                    couple_id: coupleId,
                    user_id: userId,
                    message: trimmedMessage,
                    image_path: imagePath,
                });
            if (insertError) throw insertError;
            setPostMessage("");
            setSelectedFile(null);
            const fileInput = document.getElementById(
                "post-photo"
            ) as HTMLInputElement | null;
            if (fileInput) fileInput.value = "";
            await onPosted();
            setStatus("投稿しました！");
        } catch (error: unknown) {
            console.error("投稿エラー:", error);

            // 投稿登録に失敗した場合、アップロード済みの写真を削除
            if (imagePath) {
                const { error: removeError } = await supabase.storage
                    .from("album-photos")
                    .remove([imagePath]);
                if (removeError) {
                    console.error("写真削除エラー:", removeError.message);
                }
            }
            setStatus(
                error instanceof Error
                    ? `投稿に失敗しました: ${error.message}`
                    : "投稿に失敗しました。コンソールを確認してください。"
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <section>
            <h2>思い出を投稿</h2>
            <form onSubmit={handlePost}>
                <div>
                    <label htmlFor="post-message">メッセージ</label>
                    <br />
                    <textarea
                        id="post-message"
                        value={postMessage}
                        onChange={(e) => setPostMessage(e.target.value)}
                        placeholder="今日の思い出を書こう..."
                        rows={4}
                        maxLength={2000}
                    />
                </div>

                <div>
                    <label htmlFor="post-photo">写真（5MB以下）</label>
                    <br />
                    <input
                        id="post-photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                            setSelectedFile(e.target.files?.[0] ?? null)
                        }
                    />
                </div>

                {selectedFile && (
                    <p>選択中：{selectedFile.name}</p>
                )}
                <button type="submit" disabled={saving}>
                    {saving ? "投稿中..." : "思い出を投稿する"}
                </button>
            </form>

            {status && <p role="status">{status}</p>}
        </section>
    );
}
