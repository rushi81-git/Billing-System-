const Product = require('./Product');
const Owner = require('./Owner');
const Customer = require('./Customer');
const Bill = require('./Bill');
const BillItem = require('./BillItem');
const Notification = require('./Notification');

// Customer → Bills
Customer.hasMany(Bill, { foreignKey: 'customer_id', as: 'bills' });
Bill.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

// Bill → BillItems
Bill.hasMany(BillItem, { foreignKey: 'bill_id', as: 'items' });
BillItem.belongsTo(Bill, { foreignKey: 'bill_id', as: 'bill' });

// Bill → Notifications
Bill.hasMany(Notification, { foreignKey: 'bill_id', as: 'notifications' });
Notification.belongsTo(Bill, { foreignKey: 'bill_id', as: 'bill' });

module.exports = { Owner, Customer, Bill, BillItem, Notification, Product };
