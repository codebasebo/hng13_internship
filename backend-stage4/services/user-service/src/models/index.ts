import { Sequelize } from 'sequelize';
import { initUserModel } from './user.model';
import { Logger } from '../../../../shared/utils/logger';

const logger = new Logger('user-service-db');

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/user_service',
  {
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export const User = initUserModel(sequelize);

export const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');
    
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('Database models synchronized');
  } catch (error) {
    logger.error('Unable to connect to the database', error as Error);
    throw error;
  }
};

export { sequelize };
