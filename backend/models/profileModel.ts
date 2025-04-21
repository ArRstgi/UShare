import fs from "fs";
import path from "path";

export interface Profile {
  id: string;
  skillsTeach: string;
  skillsLearn: string;
  availability: string;
  photoUrl?: string;
}

const DATA_PATH = path.join(__dirname, "../data/profiles.json");

let profiles: Profile[] = [];
function loadFromDisk() {
  try {
    profiles = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } catch {
    profiles = [];
  }
}
function saveToDisk() {
  fs.writeFileSync(DATA_PATH, JSON.stringify(profiles, null, 2));
}

// initialize
loadFromDisk();

export function getProfileById(id: string): Profile | undefined {
  return profiles.find((p) => p.id === id);
}

export function createProfile(data: Omit<Profile, "id">): Profile {
  const newProfile: Profile = { id: Date.now().toString(), ...data };
  profiles.push(newProfile);
  saveToDisk();
  return newProfile;
}

export function updateProfile(
  id: string,
  data: Partial<Omit<Profile, "id">>
): Profile | undefined {
  const p = getProfileById(id);
  if (!p) return undefined;
  Object.assign(p, data);
  saveToDisk();
  return p;
}