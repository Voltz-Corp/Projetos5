import { DataTypes } from 'sequelize';
import { sequelize } from '../database.js';

const Incident = sequelize.define('Incident', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('poda', 'risco', 'queda'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('aberto', 'em_analise', 'concluido'),
    allowNull: false,
    defaultValue: 'aberto'
  },
  bairro: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  image: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'incidents',
  timestamps: true,
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['bairro']
    },
    {
      fields: ['lat', 'lng']
    }
  ]
});

export default Incident;