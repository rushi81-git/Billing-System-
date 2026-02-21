const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Bill = sequelize.define(
  'Bill',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    bill_id: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    customer_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount_percent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    final_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    amount_paid: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Amount paid at time of purchase',
    },
    amount_due: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Remaining balance to be collected',
    },
    payment_status: {
      type: DataTypes.ENUM('PAID', 'PENDING'),
      defaultValue: 'PENDING',
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    public_token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: 'bills',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['bill_id'] },
      { unique: true, fields: ['public_token'] },
    ],
  }
);

module.exports = Bill;
