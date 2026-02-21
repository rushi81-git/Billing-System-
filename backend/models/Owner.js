const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Owner = sequelize.define(
  'Owner',
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
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('OWNER'),
      defaultValue: 'OWNER',
    },
  },
  {
    tableName: 'owners',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Owner;
