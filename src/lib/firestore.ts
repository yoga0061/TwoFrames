import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  orderBy,
  limit,
  startAfter,
  type Unsubscribe,
  type DocumentSnapshot,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import { uploadToCloudinary } from "./cloudinary";
import type { UserProfile, Couple, DailyMemory, MoodEntry, MoodType, FutureMessage, CoupleSong, PlaylistItem, CouplePlaylist } from "@/types";
import { generateCoupleCode, getTodayDateString, toSafeMillis } from "./utils";

export async function createUserProfile(
  uid: string,
  data: {
    name: string;
    gender: string;
    email: string;
    relationshipStartDate: Date;
  }
): Promise<UserProfile> {
  // Unique code derived from uid — avoids a Firestore query during signup
  const coupleCode = generateCoupleCode(uid);

  const profile: Omit<UserProfile, "uid"> & { uid: string } = {
    uid,
    name: data.name,
    gender: data.gender,
    email: data.email,
    relationshipStartDate: Timestamp.fromDate(data.relationshipStartDate),
    coupleId: null,
    coupleCode,
    createdAt: Timestamp.now(),
    onboarded: false,
  };

  await setDoc(doc(getFirebaseDb(), "users", uid), profile);
  await setDoc(doc(getFirebaseDb(), "coupleCodes", coupleCode.toUpperCase()), {
    uid,
    createdAt: Timestamp.now(),
  });
  return profile as UserProfile;
}

export async function ensureCoupleCodeIndex(profile: UserProfile): Promise<void> {
  const code = profile.coupleCode.toUpperCase();
  const codeRef = doc(getFirebaseDb(), "coupleCodes", code);
  const snap = await getDoc(codeRef);
  if (!snap.exists()) {
    await setDoc(codeRef, { uid: profile.uid, createdAt: Timestamp.now() });
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(getFirebaseDb(), "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as UserProfile;
}

export async function getPartnerProfile(
  coupleId: string,
  currentUid: string
): Promise<UserProfile | null> {
  const coupleSnap = await getDoc(doc(getFirebaseDb(), "couples", coupleId));
  if (!coupleSnap.exists()) return null;

  const couple = coupleSnap.data() as Couple;
  const partnerId = couple.memberIds.find((id) => id !== currentUid);
  if (!partnerId) return null;

  return getUserProfile(partnerId);
}

export async function joinCouple(
  userId: string,
  partnerCode: string
): Promise<string> {
  const db = getFirebaseDb();

  let user: UserProfile | null;
  try {
    user = await getUserProfile(userId);
  } catch {
    throw new Error("Could not load your profile. Publish Firestore rules in Firebase Console.");
  }

  if (!user) throw new Error("User not found");
  if (user.coupleId) throw new Error("You are already connected to a partner");

  let code = partnerCode.toUpperCase().trim();
  if (code.startsWith("TF-")) {
    code = code.substring(3);
  }
  code = code.replace(/[- ]/g, "");

  let codeSnap;
  try {
    codeSnap = await getDoc(doc(db, "coupleCodes", code));
  } catch {
    throw new Error("Could not look up code. Publish Firestore rules in Firebase Console.");
  }

  if (!codeSnap.exists()) {
    throw new Error("Invalid code — ask your partner to open Create Room first, then share the code again.");
  }

  const partnerUid = codeSnap.data().uid as string;
  if (partnerUid === userId) throw new Error("You cannot join your own room");

  const partner = await getUserProfile(partnerUid);
  if (!partner) throw new Error("Partner not found");
  if (partner.coupleId) throw new Error("This room is already full");

  const startDate =
    user.relationshipStartDate.toMillis() < partner.relationshipStartDate.toMillis()
      ? user.relationshipStartDate
      : partner.relationshipStartDate;

  const coupleRef = doc(collection(db, "couples"));
  const coupleId = coupleRef.id;

  const batch = writeBatch(db);
  batch.set(coupleRef, {
    id: coupleId,
    memberIds: [userId, partnerUid],
    relationshipStartDate: startDate,
    createdAt: Timestamp.now(),
  });
  batch.update(doc(db, "users", userId), { coupleId });
  batch.update(doc(db, "users", partnerUid), { coupleId });

  try {
    await batch.commit();
  } catch {
    throw new Error("Could not create couple room. Publish Firestore rules in Firebase Console.");
  }

  return coupleId;
}

export async function getCouple(coupleId: string): Promise<Couple | null> {
  const snap = await getDoc(doc(getFirebaseDb(), "couples", coupleId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Couple;
}

export async function uploadDailyMemory(
  userId: string,
  coupleId: string,
  file: File,
  caption?: string,
  note?: string,
  signal?: AbortSignal
): Promise<DailyMemory> {
  const today = getTodayDateString();
  const db = getFirebaseDb();

  const existingQ = query(
    collection(db, "dailyMemories"),
    where("coupleId", "==", coupleId),
    where("userId", "==", userId),
    where("uploadDate", "==", today)
  );
  const existing = await getDocs(existingQ);
  if (!existing.empty) {
    throw new Error("You already uploaded today's memory");
  }

  const imageUrl = await uploadToCloudinary(file, signal);

  const batch = writeBatch(db);
  const memoryRef = doc(collection(db, "dailyMemories"));

  const payload = {
    coupleId,
    userId,
    imageUrl,
    caption: caption || "",
    note: note || "",
    uploadDate: today,
    createdAt: serverTimestamp(),
  };

  if (process.env.NODE_ENV !== "production") {
    console.log("WRITE PAYLOAD [dailyMemories]", payload);
  }

  batch.set(memoryRef, payload);

  await batch.commit();

  return {
    id: memoryRef.id,
    coupleId,
    userId,
    imageUrl,
    caption,
    note,
    uploadDate: today,
    createdAt: Timestamp.now(),
  };
}

export async function getTodayMemory(userId: string, coupleId: string): Promise<DailyMemory | null> {
  const today = getTodayDateString();
  const q = query(
    collection(getFirebaseDb(), "dailyMemories"),
    where("coupleId", "==", coupleId),
    where("userId", "==", userId),
    where("uploadDate", "==", today),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const match = snap.docs[0];
  return { id: match.id, ...match.data() } as DailyMemory;
}


export function subscribeToMemories(
  coupleId: string,
  callback: (memories: DailyMemory[]) => void,
  limitCount?: number
): Unsubscribe {
  let q = query(
    collection(getFirebaseDb(), "dailyMemories"),
    where("coupleId", "==", coupleId),
    orderBy("createdAt", "desc")
  );
  if (limitCount) {
    q = query(q, limit(limitCount));
  }

  return onSnapshot(
    q,
    (snap) => {
      const memories = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DailyMemory);
      callback(memories);
    },
    (err) => {
      console.warn("Firestore memories subscription warning:", err);
    }
  );
}

async function getLatestMoodEntry(userId: string, coupleId: string): Promise<MoodEntry | null> {
  const q = query(
    collection(getFirebaseDb(), "moods"),
    where("coupleId", "==", coupleId),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  const found = snap.docs.find((d) => d.data().userId === userId);
  return found ? ({ id: found.id, ...found.data() } as MoodEntry) : null;
}

export async function updateMood(
  userId: string,
  coupleId: string,
  mood: MoodType,
  cooldownMinutes = 30
): Promise<void> {
  const lastMood = await getLatestMoodEntry(userId, coupleId);

  if (lastMood?.createdAt) {
    const lastTime = toSafeMillis(lastMood.createdAt);
    const cooldownMs = cooldownMinutes * 60 * 1000;
    if (lastTime > 0 && Date.now() - lastTime < cooldownMs) {
      const minsRemaining = Math.ceil((cooldownMs - (Date.now() - lastTime)) / 60000);
      throw new Error(`You can update your mood again in ${minsRemaining} minutes`);
    }
  }

  const db = getFirebaseDb();
  const moodRef = doc(collection(db, "moods"));
  const payload = {
    coupleId,
    userId,
    mood,
    createdAt: serverTimestamp(),
  };

  if (process.env.NODE_ENV !== "production") {
    console.log("WRITE PAYLOAD [moods]", payload);
  }

  await setDoc(moodRef, payload, { merge: true });
}

export async function getLatestMood(userId: string, coupleId: string): Promise<MoodEntry | null> {
  return getLatestMoodEntry(userId, coupleId);
}

export function subscribeToMoods(
  coupleId: string,
  callback: (moods: MoodEntry[]) => void,
  limitCount = 50
): Unsubscribe {
  const q = query(
    collection(getFirebaseDb(), "moods"),
    where("coupleId", "==", coupleId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    (snap) => {
      const moods = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MoodEntry);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[DEV DEBUG] subscribeToMoods update: received ${moods.length} moods`);
      }
      callback(moods);
    },
    (err) => {
      if (process.env.NODE_ENV !== "production") {
        console.error("[DEV DEBUG] subscribeToMoods error:", err);
      }
      console.warn("Firestore moods subscription warning:", err);
    }
  );
}

export async function getMemoriesPaginated(
  coupleId: string,
  limitCount: number,
  startAfterDocSnap?: DocumentSnapshot | null
): Promise<{ memories: DailyMemory[]; lastVisible: DocumentSnapshot | null }> {
  let q = query(
    collection(getFirebaseDb(), "dailyMemories"),
    where("coupleId", "==", coupleId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  if (startAfterDocSnap) {
    q = query(q, startAfter(startAfterDocSnap));
  }
  const snap = await getDocs(q);
  const memories = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DailyMemory);
  const lastVisible = snap.docs[snap.docs.length - 1] || null;
  return { memories, lastVisible };
}

export async function updateUserProfile(
  uid: string,
  data: {
    name?: string;
    relationshipStartDate?: Date;
    coupleId?: string | null;
    onboarded?: boolean;
  }
): Promise<void> {
  const db = getFirebaseDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.relationshipStartDate !== undefined) {
    updateData.relationshipStartDate = Timestamp.fromDate(data.relationshipStartDate);
  }
  if (data.onboarded !== undefined) updateData.onboarded = data.onboarded;

  await updateDoc(doc(db, "users", uid), updateData);

  // If start date changed and they have a coupleId, update the couple document too!
  if (data.relationshipStartDate !== undefined && data.coupleId) {
    await updateDoc(doc(db, "couples", data.coupleId), {
      relationshipStartDate: Timestamp.fromDate(data.relationshipStartDate),
    });
  }
}


export async function saveFutureMessage(
  coupleId: string,
  senderId: string,
  message: string,
  imageUrl: string | null,
  unlockAt: Date
): Promise<void> {
  const db = getFirebaseDb();
  await addDoc(collection(db, "futureMessages"), {
    coupleId,
    senderId,
    message,
    imageUrl: imageUrl || null,
    unlockAt: Timestamp.fromDate(unlockAt),
    createdAt: serverTimestamp(),
    opened: false,
  });
}

export function subscribeToFutureMessages(
  coupleId: string,
  callback: (messages: FutureMessage[]) => void
): Unsubscribe {
  const q = query(
    collection(getFirebaseDb(), "futureMessages"),
    where("coupleId", "==", coupleId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FutureMessage);
      // Sort by unlock time ascending
      const sorted = [...messages].sort((a, b) => toSafeMillis(a.unlockAt) - toSafeMillis(b.unlockAt));
      callback(sorted);
    },
    (err) => {
      console.warn("Firestore future messages subscription warning:", err);
    }
  );
}

export async function markFutureMessageAsOpened(messageId: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "futureMessages", messageId), {
    opened: true,
  });
}

export async function updateCoupleSong(
  coupleId: string,
  song: CoupleSong | null
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "couples", coupleId), {
    coupleSong: song,
  });
}

export function subscribeToCouple(
  coupleId: string,
  callback: (couple: Couple | null) => void
): Unsubscribe {
  const db = getFirebaseDb();
  return onSnapshot(
    doc(db, "couples", coupleId),
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as Couple);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.warn("Firestore couple room subscription warning:", err);
    }
  );
}

export async function getFutureMessageSecret(
  messageId: string
): Promise<{ message: string; imageUrl: string | null } | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, "futureMessages", messageId));
  if (snap.exists()) {
    const data = snap.data();
    return {
      message: data?.message || "",
      imageUrl: data?.imageUrl || null,
    };
  }
  return null;
}

export function subscribeToPlaylist(
  coupleId: string,
  callback: (playlist: CouplePlaylist | null) => void
): Unsubscribe {
  const db = getFirebaseDb();
  return onSnapshot(
    doc(db, "couplePlaylist", coupleId),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as CouplePlaylist);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.warn("Firestore playlist subscription warning:", err);
    }
  );
}

export async function addSongToPlaylist(
  coupleId: string,
  song: Omit<PlaylistItem, "id" | "createdAt">
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const playlistRef = doc(db, "couplePlaylist", coupleId);
    const snap = await getDoc(playlistRef);

    const newSong: PlaylistItem = {
      id: Math.random().toString(36).substring(2, 9),
      title: song.title,
      url: song.url,
      platform: song.platform,
      addedBy: song.addedBy,
      createdAt: Timestamp.now(),
    };

    let payload;
    if (snap.exists()) {
      const existingSongs = snap.data().songs || [];
      // Duplicate prevention: check URL
      if (existingSongs.some((s: PlaylistItem) => s.url === song.url)) {
        throw new Error("This song is already in the playlist!");
      }
      // Playlist length limit protection: max 50 songs
      if (existingSongs.length >= 50) {
        throw new Error("Playlist has reached its limit of 50 songs.");
      }
      payload = {
        coupleId,
        songs: [...existingSongs, newSong],
      };
    } else {
      payload = {
        coupleId,
        songs: [newSong],
      };
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("WRITE PAYLOAD [couplePlaylist]", payload);
    }
    await setDoc(playlistRef, payload, { merge: true });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[DEV DEBUG] addSongToPlaylist failed:", error);
    }
    throw error;
  }
}

export async function removeSongFromPlaylist(
  coupleId: string,
  songId: string
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const playlistRef = doc(db, "couplePlaylist", coupleId);
    const snap = await getDoc(playlistRef);

    if (snap.exists()) {
      const existingSongs = snap.data().songs || [];
      const updatedSongs = existingSongs.filter((s: PlaylistItem) => s.id !== songId);
      const payload = {
        coupleId,
        songs: updatedSongs,
      };

      if (process.env.NODE_ENV !== "production") {
        console.log("WRITE PAYLOAD [couplePlaylist]", payload);
      }
      await setDoc(playlistRef, payload, { merge: true });
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[DEV DEBUG] removeSongFromPlaylist failed:", error);
    }
    throw error;
  }
}

export async function reorderPlaylist(
  coupleId: string,
  songs: PlaylistItem[]
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const playlistRef = doc(db, "couplePlaylist", coupleId);
    const payload = {
      coupleId,
      songs,
    };

    if (process.env.NODE_ENV !== "production") {
      console.log("WRITE PAYLOAD [couplePlaylist]", payload);
    }
    await setDoc(playlistRef, payload, { merge: true });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[DEV DEBUG] reorderPlaylist failed:", error);
    }
    throw error;
  }
}

export async function toggleMemoryReaction(
  memoryId: string,
  userId: string,
  reaction: string | null
): Promise<void> {
  const ref = doc(getFirebaseDb(), "dailyMemories", memoryId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    const existingReactions = data.reactions || {};
    if (reaction) {
      existingReactions[userId] = reaction;
    } else {
      delete existingReactions[userId];
    }
    await updateDoc(ref, { reactions: existingReactions });
  }
}
