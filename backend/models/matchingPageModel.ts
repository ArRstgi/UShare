import fs from "fs";
import path from "path";

// Define the Profile type
interface Profile {
  id: number;
  name?: string;
  age?: number;
  matched?: number[];
  description?: string;
}

const MATCHING_DATA_PATH = path.join(__dirname, "../data/globalProfiles.json");

let allProfiles: Profile[] = [];

function loadAllData() {
  try {
    allProfiles = JSON.parse(fs.readFileSync(MATCHING_DATA_PATH, "utf-8"));
  } catch {
    console.error("Error loading data from file:", MATCHING_DATA_PATH);
    allProfiles = [];
  }
}

function saveAllData() {
  fs.writeFileSync(MATCHING_DATA_PATH, JSON.stringify(allProfiles, null, 2));
}

loadAllData();

export function getProfileById(id: number): Profile | undefined {
  return allProfiles.find((p) => p.id === id);
}

export function getAllProfiles(): Profile[] {
    return allProfiles;
}

export function AddProfile(data: Omit<Profile, "id">): Profile {
  const newProfile: Profile = { id: Date.now(), ...data };
  allProfiles.push(newProfile);
  saveAllData();
  return newProfile;
}

export function createMatch(currentId: number, matchId: number): void {
  // Find the profile with currentId
  const currentProfile = allProfiles.find((profile) => profile.id === currentId);
  if (!currentProfile) {
    console.error(`Profile with id ${currentId} not found.`);
    return;
  }

  // Find the profile with matchId
  const matchProfile = allProfiles.find((profile) => profile.id === matchId);
  if (!matchProfile) {
    console.error(`Profile with id ${matchId} not found.`);
    return;
  }

  // Ensure the matched field exists and is an array
  if (!Array.isArray(currentProfile.matched)) {
    currentProfile.matched = [];
  }
  if (!Array.isArray(matchProfile.matched)) {
    matchProfile.matched = [];
  }

  // Add matchId to currentProfile's matched array if not already present
  if (!currentProfile.matched.includes(matchId)) {
    currentProfile.matched.push(matchId);
  }

  // Add currentId to matchProfile's matched array if not already present
  if (!matchProfile.matched.includes(currentId)) {
    matchProfile.matched.push(currentId);
  }
  saveAllData();
}

export function removeMatch(currentId: number, matchId: number): void {
    // Find the profile with currentId
    const currentProfile = allProfiles.find((profile) => profile.id === currentId);
    if (!currentProfile) {
      console.error(`Profile with id ${currentId} not found.`);
      return;
    }
  
    // Find the profile with matchId
    const matchProfile = allProfiles.find((profile) => profile.id === matchId);
    if (!matchProfile) {
      console.error(`Profile with id ${matchId} not found.`);
      return;
    }
  
    // Ensure the matched field exists and is an array
    if (!Array.isArray(currentProfile.matched)) {
      currentProfile.matched = [];
    }
    if (!Array.isArray(matchProfile.matched)) {
      matchProfile.matched = [];
    }
  
    if (currentProfile.matched.includes(matchId)) {
      currentProfile.matched = currentProfile.matched.filter((id) => id !== matchId);
    }
  
    if (matchProfile.matched.includes(currentId)) {
      matchProfile.matched = matchProfile.matched.filter((id) => id !== currentId);
    }
    saveAllData();
  }