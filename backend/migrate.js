import { sequelize } from './database.js';
import Incident from './models/Incident.js';
import { mockIncidents } from './mock-incidents.js';

const migrateData = async () => {
  try {
    console.log('🔄 Starting database migration...');

    // Sync database (create tables)
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created successfully.');

    // Insert mock data
    const incidentsData = mockIncidents.map(incident => ({
      type: incident.type,
      status: incident.status,
      bairro: incident.bairro,
      lat: parseFloat(incident.lat),
      lng: parseFloat(incident.lng),
      createdAt: new Date(incident.createdAt),
      resolvedAt: incident.resolvedAt ? new Date(incident.resolvedAt) : null,
      image: incident.image
    }));

    await Incident.bulkCreate(incidentsData);
    console.log(`✅ Migrated ${incidentsData.length} incidents to database.`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

export default migrateData;