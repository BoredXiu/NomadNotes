import User from './User.js';
import Trip from './Trip.js';
import Expense from './Expense.js';
import Note from './Note.js';

User.hasMany(Trip, { foreignKey: 'userId', constraints: false });
Trip.belongsTo(User, { foreignKey: 'userId', constraints: false });

Trip.hasMany(Expense, { foreignKey: 'tripId', constraints: false });
Expense.belongsTo(Trip, { foreignKey: 'tripId', constraints: false });

Trip.hasMany(Note, { foreignKey: 'tripId', constraints: false });
Note.belongsTo(Trip, { foreignKey: 'tripId', constraints: false });

export { User, Trip, Expense, Note };