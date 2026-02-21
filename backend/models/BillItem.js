const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BillItem = sequelize.define(
  'BillItem',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    bill_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    product_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    line_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
  },
  {
    tableName: 'bill_items',
    timestamps: false,
  }
);

module.exports = BillItem;
