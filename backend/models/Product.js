const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    sku: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true,
      comment: 'Barcode value — auto-generated if not provided',
    },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    category: { type: DataTypes.STRING(60), allowNull: true, defaultValue: null },
    size: { type: DataTypes.STRING(20), allowNull: true, defaultValue: null },
    color: { type: DataTypes.STRING(40), allowNull: true, defaultValue: null },
    stock: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: 'products',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Product;
