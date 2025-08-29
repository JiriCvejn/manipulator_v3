import User from "./User.js";
import Storage from "./Storage.js";
import Route from "./Route.js";
import PriorityRule from "./PriorityRule.js";
import Order from "./Order.js";
import Layout from "./Layout.js";
import LayoutCell from "./LayoutCell.js";

Storage.hasMany(Route, { as: "routesFrom", foreignKey: "from_code", sourceKey: "code" });
Storage.hasMany(Route, { as: "routesTo",   foreignKey: "to_code",   sourceKey: "code" });
Route.belongsTo(Storage, { as: "from", foreignKey: "from_code", targetKey: "code" });
Route.belongsTo(Storage, { as: "to",   foreignKey: "to_code",   targetKey: "code" });

User.hasMany(Order, { foreignKey: "assignee_id" });
Order.belongsTo(User, { foreignKey: "assignee_id" });

Layout.hasMany(LayoutCell, { foreignKey: "layout_id", onDelete: "CASCADE" });
LayoutCell.belongsTo(Layout, { foreignKey: "layout_id" });

export { User, Storage, Route, PriorityRule, Order, Layout, LayoutCell };
