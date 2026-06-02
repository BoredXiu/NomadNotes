import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Note = sequelize.define('Note', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tripId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  noteDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'notes',
  timestamps: false,
});

export default Note;