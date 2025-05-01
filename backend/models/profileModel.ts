import {
  Model,
  DataTypes,
  Optional,
} from "sequelize";
import { sequelize } from "./db";


export interface ProfileAttributes {
  id: number;
  skillsTeach: string;
  skillsLearn: string;
  availability: string;
  photoUrl?: string;
}

interface ProfileCreationAttributes
  extends Optional<ProfileAttributes, "id" | "photoUrl"> {}

export class Profile
  extends Model<ProfileAttributes, ProfileCreationAttributes>
  implements ProfileAttributes
{
  public id!: number;
  public skillsTeach!: string;
  public skillsLearn!: string;
  public availability!: string;
  public photoUrl?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Profile.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    skillsTeach: { type: DataTypes.TEXT, allowNull: false },
    skillsLearn: { type: DataTypes.TEXT, allowNull: false },
    availability: { type: DataTypes.TEXT, allowNull: false },
    photoUrl: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: "profiles",
    sequelize,         
  }
);


export async function getProfileById(
  id: string
): Promise<Profile | null> {
  return Profile.findByPk(Number(id));
}


export async function createProfile(
  data: Omit<ProfileCreationAttributes, "id">
): Promise<Profile> {
  return Profile.create(data);
}

export async function updateProfile(
  id: string,
  data: Partial<Omit<ProfileAttributes, "id">>
): Promise<Profile | null> {
  const profile = await Profile.findByPk(Number(id));
  if (!profile) return null;
  return profile.update(data);
}
