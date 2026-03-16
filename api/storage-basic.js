import { createClient } from '@supabase/supabase-js';

// Low-level Supabase accessor -------------------------------------------------

let supabaseClient = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('Supabase env vars are not set for BASIC storage');
    return null;
  }
  supabaseClient = createClient(url, key, {
    auth: { persistSession: false },
  });
  return supabaseClient;
}

async function ensureUser(chatId) {
  const supabase = getSupabase();
  if (!supabase || chatId == null) return false;
  const cid = Number(chatId);
  try {
    const { data, error } = await supabase
      .from('basic_users')
      .select('chat_id')
      .eq('chat_id', cid)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') {
      console.error('Supabase basic_users select error:', error.message);
    }
    if (data) return true;
    const { error: insertError } = await supabase.from('basic_users').insert({
      chat_id: cid,
      level: 'A1',
      topic: 'ALL',
      daily_goal: 5,
    });
    if (insertError) {
      console.error('Supabase basic_users insert error:', insertError.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Supabase ensureUser error:', e?.message || e);
    return false;
  }
}

// User profile / settings -----------------------------------------------------

export async function getUserProfile(chatId) {
  const supabase = getSupabase();
  if (!supabase || chatId == null) {
    return {
      level: 'A1',
      topic: 'ALL',
    };
  }
  try {
    await ensureUser(chatId);
    const { data, error } = await supabase
      .from('basic_users')
      .select('level, topic')
      .eq('chat_id', Number(chatId))
      .maybeSingle();
    if (error) {
      console.error('Supabase getUserProfile error:', error.message);
    }
    const level = String(data?.level || 'A1').trim().toUpperCase();
    const topic = String(data?.topic || 'ALL').trim() || 'ALL';
    return {
      level,
      topic,
    };
  } catch {
    return {
      level: 'A1',
      topic: 'ALL',
    };
  }
}

export async function setUserLevel(chatId, level) {
  const supabase = getSupabase();
  if (!supabase || chatId == null) return false;
  try {
    await ensureUser(chatId);
    const { error } = await supabase
      .from('basic_users')
      .update({ level })
      .eq('chat_id', Number(chatId));
    if (error) {
      console.error('Supabase setUserLevel error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Supabase setUserLevel error:', e?.message || e);
    return false;
  }
}

export async function setUserTopic(chatId, topic) {
  const supabase = getSupabase();
  if (!supabase || chatId == null) return false;
  try {
    await ensureUser(chatId);
    const { error } = await supabase
      .from('basic_users')
      .update({ topic })
      .eq('chat_id', Number(chatId));
    if (error) {
      console.error('Supabase setUserTopic error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Supabase setUserTopic error:', e?.message || e);
    return false;
  }
}

export async function addUserToAllUsers(chatId) {
  return ensureUser(chatId);
}

// Daily goal / progress -------------------------------------------------------

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function getDailyGoal(chatId) {
  const supabase = getSupabase();
  if (!supabase || chatId == null) return 5;
  try {
    await ensureUser(chatId);
    const { data, error } = await supabase
      .from('basic_users')
      .select('daily_goal')
      .eq('chat_id', Number(chatId))
      .maybeSingle();
    if (error) {
      console.error('Supabase getDailyGoal error:', error.message);
    }
    const n = Number.parseInt(String(data?.daily_goal ?? '5'), 10);
    return Number.isFinite(n) && n > 0 && n <= 50 ? n : 5;
  } catch {
    return 5;
  }
}

export async function setDailyGoal(chatId, goal) {
  const supabase = getSupabase();
  if (!supabase || chatId == null) return false;
  try {
    await ensureUser(chatId);
    const { error } = await supabase
      .from('basic_users')
      .update({ daily_goal: goal })
      .eq('chat_id', Number(chatId));
    if (error) {
      console.error('Supabase setDailyGoal error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Supabase setDailyGoal error:', e?.message || e);
    return false;
  }
}

export async function getDailySeenCount(chatId, dateStr = null) {
  const supabase = getSupabase();
  if (!supabase || chatId == null) return 0;
  const d = dateStr || todayKey();
  try {
    const { count, error } = await supabase
      .from('basic_user_seen_words')
      .select('word_id', { count: 'exact', head: true })
      .eq('chat_id', Number(chatId))
      .eq('seen_date', d);
    if (error) {
      console.error('Supabase getDailySeenCount error:', error.message);
      return 0;
    }
    return count || 0;
  } catch {
    return 0;
  }
}

export async function markWordSeen(chatId, wordId) {
  const supabase = getSupabase();
  if (!supabase || chatId == null) return false;
  try {
    await ensureUser(chatId);
    const cid = Number(chatId);
    const id = String(wordId);
    const today = todayKey();
    const { error } = await supabase
      .from('basic_user_seen_words')
      .upsert(
        {
          chat_id: cid,
          word_id: id,
          seen_date: today,
        },
        { onConflict: 'chat_id,word_id' },
      );
    if (error) {
      console.error('Supabase markWordSeen error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Supabase markWordSeen error:', e?.message || e);
    return false;
  }
}

export async function getUserSeenIds(chatId) {
  const supabase = getSupabase();
  if (!supabase || chatId == null) return [];
  try {
    const { data, error } = await supabase
      .from('basic_user_seen_words')
      .select('word_id')
      .eq('chat_id', Number(chatId));
    if (error) {
      console.error('Supabase getUserSeenIds error:', error.message);
      return [];
    }
    return (data || []).map((row) => String(row.word_id));
  } catch (e) {
    console.error('Supabase getUserSeenIds error:', e?.message || e);
    return [];
  }
}

// Quiz stats ------------------------------------------------------------------

export async function getUserQuizProgress(chatId) {
  const supabase = getSupabase();
  if (!supabase || chatId == null) {
    return {
      seenCount: 0,
      quizTotal: 0,
      quizCorrect: 0,
    };
  }
  try {
    const [seenRes, quizRes] = await Promise.all([
      supabase
        .from('basic_user_seen_words')
        .select('word_id', { count: 'exact', head: true })
        .eq('chat_id', Number(chatId)),
      supabase
        .from('basic_user_quiz_stats')
        .select('total, correct')
        .eq('chat_id', Number(chatId))
        .eq('level', 'ALL')
        .maybeSingle(),
    ]);
    if (seenRes.error) {
      console.error('Supabase getUserQuizProgress seen error:', seenRes.error.message);
    }
    if (quizRes.error && quizRes.error.code !== 'PGRST116') {
      console.error('Supabase getUserQuizProgress quiz error:', quizRes.error.message);
    }
    const seenCount = seenRes.count || 0;
    const total = Number.parseInt(String(quizRes.data?.total ?? '0'), 10) || 0;
    const correct = Number.parseInt(String(quizRes.data?.correct ?? '0'), 10) || 0;
    return {
      seenCount,
      quizTotal: total,
      quizCorrect: correct,
    };
  } catch {
    return {
      seenCount: 0,
      quizTotal: 0,
      quizCorrect: 0,
    };
  }
}

const LEVELS = ['A1', 'A2', 'B1'];

export async function getUserQuizProgressByLevel(chatId) {
  const supabase = getSupabase();
  if (!supabase || chatId == null) {
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('basic_user_quiz_stats')
      .select('level,total,correct')
      .eq('chat_id', Number(chatId));
    if (error) {
      console.error('Supabase getUserQuizProgressByLevel error:', error.message);
      return null;
    }
    const out = {};
    LEVELS.forEach((l) => {
      const row = (data || []).find((r) => r.level === l);
      const total = Number.parseInt(String(row?.total ?? '0'), 10) || 0;
      const correct = Number.parseInt(String(row?.correct ?? '0'), 10) || 0;
      out[l] = { total, correct };
    });
    return out;
  } catch {
    return null;
  }
}

export async function incrementQuizStats(chatId, level, isCorrect) {
  const supabase = getSupabase();
  if (!supabase || chatId == null) return false;
  try {
    await ensureUser(chatId);
    const cid = Number(chatId);
    const lvl = String(level || 'A1').trim().toUpperCase();

    const updateRow = async (targetLevel) => {
      const { data, error } = await supabase
        .from('basic_user_quiz_stats')
        .select('total,correct')
        .eq('chat_id', cid)
        .eq('level', targetLevel)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error('Supabase quiz stats select error:', error.message);
      }
      const currentTotal = Number.parseInt(String(data?.total ?? '0'), 10) || 0;
      const currentCorrect = Number.parseInt(String(data?.correct ?? '0'), 10) || 0;
      const next = {
        chat_id: cid,
        level: targetLevel,
        total: currentTotal + 1,
        correct: currentCorrect + (isCorrect ? 1 : 0),
      };
      const { error: upsertError } = await supabase
        .from('basic_user_quiz_stats')
        .upsert(next, { onConflict: 'chat_id,level' });
      if (upsertError) {
        console.error('Supabase quiz stats upsert error:', upsertError.message);
      }
    };

    await Promise.all([updateRow('ALL'), updateRow(lvl)]);
    return true;
  } catch (e) {
    console.error('Supabase incrementQuizStats error:', e?.message || e);
    return false;
  }
}

export async function resetUserStats(chatId) {
  const supabase = getSupabase();
  if (!supabase || chatId == null) return false;
  const cid = Number(chatId);
  try {
    const [seenDel, quizDel] = await Promise.all([
      supabase.from('basic_user_seen_words').delete().eq('chat_id', cid),
      supabase.from('basic_user_quiz_stats').delete().eq('chat_id', cid),
    ]);
    if (seenDel.error) console.error('Supabase resetUserStats seen error:', seenDel.error.message);
    if (quizDel.error) console.error('Supabase resetUserStats quiz error:', quizDel.error.message);
    return true;
  } catch (e) {
    console.error('Supabase resetUserStats error:', e?.message || e);
    return false;
  }
}

// Subscribers / all users -----------------------------------------------------

export async function getSubscribers() {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('basic_subscriptions')
      .select('chat_id')
      .eq('daily_words_enabled', true);
    if (error) {
      console.error('Supabase getSubscribers error:', error.message);
      return [];
    }
    return (data || []).map((row) => row.chat_id);
  } catch (e) {
    console.error('Supabase getSubscribers error:', e?.message || e);
    return [];
  }
}

export async function addSubscriber(chatId) {
  const supabase = getSupabase();
  if (!supabase || chatId == null) return false;
  try {
    await ensureUser(chatId);
    const { error } = await supabase
      .from('basic_subscriptions')
      .upsert(
        { chat_id: Number(chatId), daily_words_enabled: true },
        { onConflict: 'chat_id' },
      );
    if (error) {
      console.error('Supabase addSubscriber error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Supabase addSubscriber error:', e?.message || e);
    return false;
  }
}

export async function removeSubscriber(chatId) {
  const supabase = getSupabase();
  if (!supabase || chatId == null) return false;
  try {
    const { error } = await supabase
      .from('basic_subscriptions')
      .update({ daily_words_enabled: false })
      .eq('chat_id', Number(chatId));
    if (error) {
      console.error('Supabase removeSubscriber error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Supabase removeSubscriber error:', e?.message || e);
    return false;
  }
}

export async function getAllUsers() {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('basic_users')
      .select('chat_id');
    if (error) {
      console.error('Supabase getAllUsers error:', error.message);
      return [];
    }
    return (data || []).map((row) => row.chat_id);
  } catch (e) {
    console.error('Supabase getAllUsers error:', e?.message || e);
    return [];
  }
}

export async function removeUserFromAllUsers(chatId) {
  const supabase = getSupabase();
  if (!supabase || chatId == null) return false;
  try {
    // Для admin-broadcast достаточно отключить подписку, чтобы не слать дальше
    await removeSubscriber(chatId);
    return true;
  } catch (e) {
    console.error('Supabase removeUserFromAllUsers error:', e?.message || e);
    return false;
  }
}

