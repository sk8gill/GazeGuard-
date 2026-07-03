import { openDB } from "idb";

export async function getDB() {
  return openDB("gazeguard-db", 1, {
    upgrade(db) {
      const store = db.createObjectStore("sessions", {
        keyPath: "id",
        autoIncrement: true,
      });
      store.createIndex("startTime", "startTime");
    },
  });
}