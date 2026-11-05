"use client";
import styles from "./page.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Account from "@/components/Account/page";

export default function Home() {
  const router = useRouter();

  async function handleLogout() {
    router.push("/login");
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>カップルアプリ</h1>

      <Account />
      <hr />
      <button type="button" onClick={handleLogout}>
        ログアウト
      </button>
      <Link href="/album">
        <button>共有一覧</button>
      </Link>
    </main>
  );
}
