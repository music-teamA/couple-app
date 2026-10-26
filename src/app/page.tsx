"use client";
import styles from "./page.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Account from "@/components/Account/page";

type Couple = {
  id: string;
  name: string;
};

export default function Home() {
  const [couples, setCouples] = useState<Couple[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

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
        const albums = (data ?? [])
          .map((item) => item.couples)
          .flat()
          .filter(
            (album): album is Couple => album !== null
          );
        setCouples(albums);
      }
      setLoading(false);
    }
    void loadCouples();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      setErrorMessage("ログアウトに失敗しました。");
      return;
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>カップルアプリ</h1>

      <Account />
      <hr />
      {loading ? (
        <p>アルバムを読み込み中...</p>
      ) : (
        <>
          <section>
            <h2>共有アルバム</h2>
            <p>ふたりの思い出を残していきましょう。</p>

            <Link href="/album/new">
              <button type="button">
                共有アルバムを作成
              </button>
            </Link>
          </section>

          <section>
            <h2>作成済みのアルバム</h2>
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
      <hr />
      <button type="button" onClick={handleLogout}>
        ログアウト
      </button>
    </main>
  );
}
