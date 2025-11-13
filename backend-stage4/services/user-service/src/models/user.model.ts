import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export interface UserAttributes {
  id: string;
  name: string;
  email: string;
  password: string;
  push_token?: string;
  email_preference: boolean;
  push_preference: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public name!: string;
  public email!: string;
  public password!: string;
  public push_token?: string;
  public email_preference!: boolean;
  public push_preference!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export const initUserModel = (sequelize: Sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      push_token: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      email_preference: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      push_preference: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      sequelize,
      tableName: 'users',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return User;
};
