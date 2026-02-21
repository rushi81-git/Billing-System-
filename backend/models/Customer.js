const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define(
  'Customer',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: 'customers',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['phone'] },
    ],
  }
);

module.exports = Customer;
