import { getDB } from "./db";

export async function saveSession(session) {
  const db = await getDB();
  return db.add("sessions", session);
}

export async function getAllSessions() {
  const db = await getDB();
  return db.getAllFromIndex("sessions", "startTime");
}