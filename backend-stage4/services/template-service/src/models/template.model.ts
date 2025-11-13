import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { NotificationType } from '../../../../../shared/enums/notification.enum';

export interface TemplateAttributes {
  id: string;
  code: string;
  name: string;
  type: NotificationType;
  subject?: string;
  content: string;
  language: string;
  version: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface TemplateCreationAttributes extends Optional<TemplateAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Template extends Model<TemplateAttributes, TemplateCreationAttributes> implements TemplateAttributes {
  public id!: string;
  public code!: string;
  public name!: string;
  public type!: NotificationType;
  public subject?: string;
  public content!: string;
  public language!: string;
  public version!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export const initTemplateModel = (sequelize: Sequelize) => {
  Template.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM(...Object.values(NotificationType)),
        allowNull: false
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: true
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      language: {
        type: DataTypes.STRING,
        defaultValue: 'en'
      },
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      sequelize,
      tableName: 'templates',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return Template;
};
