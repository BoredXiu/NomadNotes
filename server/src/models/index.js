import User from "./User.js";
import Trip from "./Trip.js";
import Expense from "./Expense.js";
import Note from "./Note.js";
import AuditLog from "./AuditLog.js";
import AdminOperationLog from "./AdminOperationLog.js";

User.hasMany(Trip, { foreignKey: "userId", constraints: false });
Trip.belongsTo(User, { foreignKey: "userId", constraints: false });

Trip.hasMany(Expense, { foreignKey: "tripId", constraints: false });
Expense.belongsTo(Trip, { foreignKey: "tripId", constraints: false });

Trip.hasMany(Note, { foreignKey: "tripId", constraints: false });
Note.belongsTo(Trip, { foreignKey: "tripId", constraints: false });

// 审核日志关联：使用 constraints: false 遵循无外键约束规则
Trip.hasMany(AuditLog, { foreignKey: "tripId", constraints: false });
AuditLog.belongsTo(Trip, { foreignKey: "tripId", constraints: false });
User.hasMany(AuditLog, { foreignKey: "userId", constraints: false });
AuditLog.belongsTo(User, { foreignKey: "userId", constraints: false });

export { User, Trip, Expense, Note, AuditLog };
