import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "./db"; // Assuming you have a db.ts setup

export interface ReviewAttributes {
  id: number;
  stars: number;
  teacherName: string;
  skill: string;
  reviewerName: string;
  date: string;
  reviewText: string;
}

interface ReviewCreationAttributes 
  extends Optional<ReviewAttributes, "id"> {}

export class Review 
  extends Model<ReviewAttributes, ReviewCreationAttributes>
  implements ReviewAttributes {
  
  public id!: number;
  public stars!: number;
  public teacherName!: string;
  public skill!: string;
  public reviewerName!: string;
  public date!: string;
  public reviewText!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Review.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    stars: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    teacherName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    skill: {
      type: DataTypes.STRING,
      allowNull: false
    },
    reviewerName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    reviewText: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    tableName: "reviews",
    sequelize,
    timestamps: true // Adds createdAt and updatedAt automatically
  }
);


export async function getAllReviews(): Promise<Review[]> {
  return Review.findAll();
}

export async function addReview(newReview: Omit<ReviewAttributes, "id">): Promise<Review> {
  return Review.create(newReview);
}

export async function deleteReview(
  teacherName: string, 
  reviewText: string
): Promise<boolean> {
  const result = await Review.destroy({
    where: {
      teacherName,
      reviewText
    }
  });
  return result > 0;
}