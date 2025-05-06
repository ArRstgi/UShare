import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "./db";

interface MatchingProfileAttributes {
  id: number;
  username?: string;
  age?: number;
  matched?: number[];
  description?: string;
  photoUrl?: string | null;
}

interface MatchingProfileCreationAttributes
  extends Optional<MatchingProfileAttributes, "id"> {}

export class MatchingProfile
  extends Model<MatchingProfileAttributes, MatchingProfileCreationAttributes>
  implements MatchingProfileAttributes
{
  public id!: number;
  public username?: string;
  public age?: number;
  public matched?: number[];
  public description?: string;
  public photoUrl?: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MatchingProfile.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    matched: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    photoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "matching_profiles",
    sequelize,
  }
);

export async function getProfileById(
  id: number
): Promise<MatchingProfile | null> {
  return MatchingProfile.findByPk(id);
}

export async function getAllProfiles(): Promise<MatchingProfile[]> {
  return MatchingProfile.findAll();
}

export async function AddProfile(
  data: Omit<MatchingProfileCreationAttributes, "id">
): Promise<MatchingProfile> {
  return MatchingProfile.create(data);
}

export async function createMatch(
  currentId: number,
  matchId: number
): Promise<void> {
  const currentProfile = await MatchingProfile.findByPk(currentId);
  const matchProfile = await MatchingProfile.findByPk(matchId);

  if (!currentProfile || !matchProfile) {
    console.error(
      `One or both profiles not found: currentId=${currentId}, matchId=${matchId}`
    );
    return;
  }

  const currentMatched = Array.isArray(currentProfile.matched)
    ? [...currentProfile.matched]
    : [];
  const matchMatched = Array.isArray(matchProfile.matched)
    ? [...matchProfile.matched]
    : [];

  if (!currentMatched.includes(matchId)) {
    currentMatched.push(matchId);
    currentProfile.matched = currentMatched;
  }

  if (!matchMatched.includes(currentId)) {
    matchMatched.push(currentId);
    matchProfile.matched = matchMatched;
  }

  await Promise.all([
    currentProfile.changed() ? currentProfile.save() : Promise.resolve(),
    matchProfile.changed() ? matchProfile.save() : Promise.resolve(),
  ]);
}

export async function removeMatch(
  currentId: number,
  matchId: number
): Promise<void> {
  const currentProfile = await MatchingProfile.findByPk(currentId);
  const matchProfile = await MatchingProfile.findByPk(matchId);

  if (!currentProfile || !matchProfile) {
    console.error(
      `One or both profiles not found for removal: currentId=${currentId}, matchId=${matchId}`
    );
    return;
  }

  let currentChanged = false;
  let matchChanged = false;

  if (Array.isArray(currentProfile.matched)) {
    const initialLength = currentProfile.matched.length;
    currentProfile.matched = currentProfile.matched.filter(
      (id) => id !== matchId
    );
    if (currentProfile.matched.length !== initialLength) {
      currentChanged = true;
    }
  }

  if (Array.isArray(matchProfile.matched)) {
    const initialLength = matchProfile.matched.length;
    matchProfile.matched = matchProfile.matched.filter(
      (id) => id !== currentId
    );
    if (matchProfile.matched.length !== initialLength) {
      matchChanged = true;
    }
  }

  await Promise.all([
    currentChanged ? currentProfile.save() : Promise.resolve(),
    matchChanged ? matchProfile.save() : Promise.resolve(),
  ]);
}