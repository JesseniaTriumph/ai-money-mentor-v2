import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profileRes, quizRes, moduleRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("quiz_results").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(50),
    supabase.from("module_progress").select("*").eq("user_id", user.id),
  ]);

  return NextResponse.json({
    profile: profileRes.data,
    quizHistory: quizRes.data ?? [],
    modules: moduleRes.data ?? [],
  });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, payload } = await req.json();

  if (type === "quiz") {
    const { section_key, correct, xp_earned, question_idx } = payload;

    // Save quiz result
    await supabase.from("quiz_results").insert({ user_id: user.id, section_key, question_idx: question_idx ?? 0, correct, xp_earned: correct ? xp_earned : 0 });

    // Add XP to profile if correct
    if (correct && xp_earned > 0) {
      const { error: rpcErr } = await supabase.rpc("increment_xp", { uid: user.id, amount: xp_earned });

      // Fallback manual update only if RPC failed or does not exist
      if (rpcErr) {
        const { data: profile } = await supabase.from("profiles").select("total_xp").eq("id", user.id).single();
        if (profile) {
          const newXp = (profile.total_xp ?? 0) + xp_earned;
          const newLevel = newXp >= 4000 ? 6 : newXp >= 2000 ? 5 : newXp >= 1000 ? 4 : newXp >= 500 ? 3 : newXp >= 200 ? 2 : 1;
          await supabase.from("profiles").update({ total_xp: newXp, current_level: newLevel, last_active: new Date().toISOString().split("T")[0] }).eq("id", user.id);
        }
      }
    }

    return NextResponse.json({ success: true });
  }

  if (type === "module") {
    const { module_name, section_key, status, best_score } = payload;
    await supabase.from("module_progress").upsert(
      { user_id: user.id, module_name, section_key, status, best_score: best_score ?? 0, completed_at: status === "completed" || status === "mastered" ? new Date().toISOString() : null },
      { onConflict: "user_id,module_name" }
    );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
