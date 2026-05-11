import { useCallback, useState } from "react";
import { getSupabaseClient } from "../lib/supabaseClient";

const LS_NICK = "amb_nickname";
const LS_USER = "amb_user_id";

export interface UseAnonymousAuthResult {
  /** Current Supabase anonymous user id, or null before sign-in. */
  userId: string | null;
  /** Nickname the user entered at the login screen, or null before sign-in. */
  nickname: string | null;
  /**
   * Sign the participant in anonymously with the given nickname. Stores the
   * Supabase user id + nickname in localStorage so a quick reload survives
   * an anonymous session expiry. Throws if Supabase rejects the call.
   */
  signInAs: (nickname: string) => Promise<string>;
}

/**
 * Anonymous sign-in for the meetup networking bingo.
 *
 * Why anonymous: the meetup is one-shot and we never want to ask attendees
 * for an email or password. Supabase Anonymous Sign-In gives us a real
 * Supabase user row (so Realtime + RLS work) without any credential
 * collection.
 *
 * localStorage backup: anonymous sessions can be re-issued if the browser
 * clears them, but we don't want a participant to lose their board mid-game,
 * so we stash the user id + nickname locally. A future
 * `restoreSession`/hot-recovery flow can re-attach to the same row if it
 * exists, otherwise create a new anon session under the same nickname.
 */
export function useAnonymousAuth(): UseAnonymousAuthResult {
  const [userId, setUserId] = useState<string | null>(
    () => localStorage.getItem(LS_USER),
  );
  const [nickname, setNickname] = useState<string | null>(
    () => localStorage.getItem(LS_NICK),
  );

  const signInAs = useCallback(async (rawNickname: string) => {
    const cleaned = rawNickname.trim();
    if (!cleaned) {
      throw new Error("nickname required");
    }
    const { data, error } = await getSupabaseClient().auth.signInAnonymously({
      options: { data: { nickname: cleaned } },
    });
    if (error) {
      throw error;
    }
    const id = data.user!.id;
    localStorage.setItem(LS_NICK, cleaned);
    localStorage.setItem(LS_USER, id);
    setUserId(id);
    setNickname(cleaned);
    return id;
  }, []);

  return { userId, nickname, signInAs };
}
