import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password." });
  }

  try {
    const q = query(collection(db, "employees"), where("email", "==", email));
    const snap = await getDocs(q);

    if (snap.empty) {
      return res.status(404).json({ error: "User not found." });
    }

    const userDoc = snap.docs[0].ref;

    await updateDoc(userDoc, {
      password, // ⚠️ Don't do this in production. Hash it!
    });

    return res.status(200).json({ message: "Password updated." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: "Failed to reset password." });
  }
}
