import express from 'express';
import cors from 'cors';
import { sequelize, testConnection } from './database.js';
import { Op } from 'sequelize';
import Incident from './models/Incident.js';
import migrateData from './migrate.js';
import geminiService from './gemini-service.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const initializeDatabase = async () => {
  try {
    await testConnection();
    await migrateData();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello World from Backend!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// GET /api/incidents - Get all incidents with optional filters
app.get('/api/incidents', async (req, res) => {
  try {
    const { type, status, bairro, limit = 100, offset = 0 } = req.query;

    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (bairro) where.bairro = { [sequelize.Op.iLike]: `%${bairro}%` };

    const incidents = await Incident.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      data: incidents.rows,
      message: 'Incidents retrieved successfully',
      success: true,
      total: incidents.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({
      message: 'Failed to retrieve incidents',
      success: false,
      error: error.message
    });
  }
});

// GET /api/incidents/:id - Get single incident
app.get('/api/incidents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await Incident.findByPk(id);

    if (!incident) {
      return res.status(404).json({
        message: 'Incident not found',
        success: false
      });
    }

    res.json({
      data: incident,
      message: 'Incident retrieved successfully',
      success: true
    });
  } catch (error) {
    console.error('Error fetching incident:', error);
    res.status(500).json({
      message: 'Failed to retrieve incident',
      success: false,
      error: error.message
    });
  }
});

// POST /api/incidents - Create new incident
app.post('/api/incidents', async (req, res) => {
  try {
    const { type, status, bairro, lat, lng, image } = req.body;

    // Validation
    if (!type || !bairro || !lat || !lng || !image) {
      return res.status(400).json({
        message: 'Missing required fields: type, bairro, lat, lng, image',
        success: false
      });
    }

    if (!['poda', 'risco', 'queda'].includes(type)) {
      return res.status(400).json({
        message: 'Invalid type. Must be: poda, risco, queda',
        success: false
      });
    }

    if (status && !['aberto', 'em_analise', 'concluido'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be: aberto, em_analise, concluido',
        success: false
      });
    }

    const incident = await Incident.create({
      type,
      status: status || 'aberto',
      bairro,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      image
    });

    res.status(201).json({
      data: incident,
      message: 'Incident created successfully',
      success: true
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({
      message: 'Failed to create incident',
      success: false,
      error: error.message
    });
  }
});

// PUT /api/incidents/:id - Update incident
app.put('/api/incidents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, status, bairro, lat, lng, image } = req.body;

    const incident = await Incident.findByPk(id);
    if (!incident) {
      return res.status(404).json({
        message: 'Incident not found',
        success: false
      });
    }

    // Validation
    if (type && !['poda', 'risco', 'queda'].includes(type)) {
      return res.status(400).json({
        message: 'Invalid type. Must be: poda, risco, queda',
        success: false
      });
    }

    if (status && !['aberto', 'em_analise', 'concluido'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be: aberto, em_analise, concluido',
        success: false
      });
    }

    // Update resolvedAt based on status
    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'concluido') {
        updateData.resolvedAt = new Date();
      } else if (status === 'aberto' || status === 'em_analise') {
        updateData.resolvedAt = null;
      }
    }
    if (bairro !== undefined) updateData.bairro = bairro;
    if (lat !== undefined) updateData.lat = parseFloat(lat);
    if (lng !== undefined) updateData.lng = parseFloat(lng);
    if (image !== undefined) updateData.image = image;

    await incident.update(updateData);

    res.json({
      data: incident,
      message: 'Incident updated successfully',
      success: true
    });
  } catch (error) {
    console.error('Error updating incident:', error);
    res.status(500).json({
      message: 'Failed to update incident',
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/incidents/:id - Delete incident
app.delete('/api/incidents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await Incident.findByPk(id);

    if (!incident) {
      return res.status(404).json({
        message: 'Incident not found',
        success: false
      });
    }

    await incident.destroy();

    res.json({
      message: 'Incident deleted successfully',
      success: true
    });
  } catch (error) {
    console.error('Error deleting incident:', error);
    res.status(500).json({
      message: 'Failed to delete incident',
      success: false,
      error: error.message
    });
  }
});

// GET /api/incidents/stats/summary - Get incidents statistics
app.get('/api/incidents/stats/summary', async (req, res) => {
  try {
    const [totalIncidents, statusStats, typeStats] = await Promise.all([
      Incident.count(),
      Incident.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('status')), 'count']
        ],
        group: ['status']
      }),
      Incident.findAll({
        attributes: [
          'type',
          [sequelize.fn('COUNT', sequelize.col('type')), 'count']
        ],
        group: ['type']
      })
    ]);

    res.json({
      data: {
        total: totalIncidents,
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat.dataValues.status] = parseInt(stat.dataValues.count);
          return acc;
        }, {}),
        byType: typeStats.reduce((acc, stat) => {
          acc[stat.dataValues.type] = parseInt(stat.dataValues.count);
          return acc;
        }, {})
      },
      message: 'Statistics retrieved successfully',
      success: true
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      message: 'Failed to retrieve statistics',
      success: false,
      error: error.message
    });
  }
});

// GET /api/insights - Generate AI insights from incidents data
app.get('/api/insights', async (req, res) => {
  try {
    // Get all incidents for analysis
    const incidents = await Incident.findAll({
      order: [['createdAt', 'DESC']]
    });

    // Generate AI insights
    const insights = await geminiService.generateInsights(incidents);

    res.json({
      data: insights,
      message: 'AI insights generated successfully',
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      message: 'Failed to generate AI insights',
      success: false,
      error: error.message
    });
  }
});

// GET /api/analytics - Get comprehensive analytics and calculations
app.get('/api/analytics', async (req, res) => {
  try {
    const { days } = req.query;
    
    // Filter by date if days parameter is provided
    let whereClause = {};
    if (days && days !== 'todos') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      whereClause.createdAt = {
        [Op.gte]: daysAgo
      };
    }

    const incidents = await Incident.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    // Calculate KPIs
    const total = incidents.length;
    const abertos = incidents.filter(i => i.status === 'aberto').length;
    const emAnalise = incidents.filter(i => i.status === 'em_analise').length;
    const concluidos = incidents.filter(i => i.status === 'concluido').length;
    const risco = incidents.filter(i => i.type === 'risco').length;

    // Calculate average resolution time (in hours)
    const resolvedIncidents = incidents.filter(i => i.status === 'concluido' && i.resolvedAt);
    const avgHoras = resolvedIncidents.length > 0
      ? resolvedIncidents.reduce((acc, inc) => {
          const created = new Date(inc.createdAt);
          const resolved = new Date(inc.resolvedAt);
          const hours = (resolved - created) / (1000 * 60 * 60);
          return acc + hours;
        }, 0) / resolvedIncidents.length
      : 0;

    // Calculate resolution rate
    const taxaResolucao = total > 0 ? ((concluidos / total) * 100).toFixed(1) : '0';

    // Top 5 bairros
    const bairroCount = {};
    incidents.forEach(inc => {
      bairroCount[inc.bairro] = (bairroCount[inc.bairro] || 0) + 1;
    });
    
    const topBairros = Object.entries(bairroCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([bairro, count]) => ({ 
        bairro, 
        count,
        percentage: ((count / total) * 100).toFixed(1)
      }));

    // Distribution by type
    const porTipo = {
      poda: incidents.filter(i => i.type === 'poda').length,
      risco: incidents.filter(i => i.type === 'risco').length,
      queda: incidents.filter(i => i.type === 'queda').length,
    };

    // Distribution by status
    const porStatus = {
      aberto: abertos,
      em_analise: emAnalise,
      concluido: concluidos,
    };

    // Incidents per day (last 14 days for chart)
    const seriesChamadosPorDia = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayIncidents = incidents.filter(inc => {
        const incDate = new Date(inc.createdAt);
        return incDate >= date && incDate < nextDate;
      });
      
      seriesChamadosPorDia.push({
        date: date.toISOString().split('T')[0],
        criados: dayIncidents.length,
        concluidos: dayIncidents.filter(i => i.status === 'concluido').length,
        risco: dayIncidents.filter(i => i.type === 'risco').length,
      });
    }

    // Resolution time histogram
    const resolucaoHistogram = [
      { range: '0-24h', value: 0 },
      { range: '24-48h', value: 0 },
      { range: '48-72h', value: 0 },
      { range: '72h+', value: 0 },
    ];
    
    resolvedIncidents.forEach(inc => {
      const created = new Date(inc.createdAt);
      const resolved = new Date(inc.resolvedAt);
      const hours = (resolved - created) / (1000 * 60 * 60);
      
      if (hours <= 24) resolucaoHistogram[0].value++;
      else if (hours <= 48) resolucaoHistogram[1].value++;
      else if (hours <= 72) resolucaoHistogram[2].value++;
      else resolucaoHistogram[3].value++;
    });

    // Status by type (for stacked bar chart)
    const statusPorTipo = [
      {
        tipo: 'Poda',
        aberto: incidents.filter(i => i.type === 'poda' && i.status === 'aberto').length,
        concluido: incidents.filter(i => i.type === 'poda' && i.status === 'concluido').length,
      },
      {
        tipo: 'Risco',
        aberto: incidents.filter(i => i.type === 'risco' && i.status === 'aberto').length,
        concluido: incidents.filter(i => i.type === 'risco' && i.status === 'concluido').length,
      },
      {
        tipo: 'Queda',
        aberto: incidents.filter(i => i.type === 'queda' && i.status === 'aberto').length,
        concluido: incidents.filter(i => i.type === 'queda' && i.status === 'concluido').length,
      },
    ];

    // Demand by type (for pie chart)
    const demandByType = [
      { name: 'Poda', value: porTipo.poda },
      { name: 'Risco', value: porTipo.risco },
      { name: 'Queda', value: porTipo.queda },
    ];

    // Efficiency by bairro (for bar chart)
    const efficiencyByBairro = Object.entries(bairroCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([bairro, totalChamados]) => {
        const resolvidosNoBairro = incidents.filter(
          i => i.bairro === bairro && i.status === 'concluido'
        ).length;
        return {
          bairro,
          eficiencia: totalChamados > 0 
            ? parseFloat(((resolvidosNoBairro / totalChamados) * 100).toFixed(1))
            : 0
        };
      });

    res.json({
      data: {
        kpis: {
          total,
          abertos,
          emAnalise,
          concluidos,
          risco,
          avgHoras: parseFloat(avgHoras.toFixed(2)),
          taxaResolucao: parseFloat(taxaResolucao),
        },
        analytics: {
          topBairros,
          porTipo,
          porStatus,
        },
        charts: {
          seriesChamadosPorDia,
          resolucaoHistogram,
          statusPorTipo,
          demandByType,
          efficiencyByBairro,
        },
        metadata: {
          periodo: days || 'todos',
          dataGeracao: new Date().toISOString(),
          totalIncidentes: total,
        }
      },
      message: 'Analytics retrieved successfully',
      success: true
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      message: 'Failed to retrieve analytics',
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// GEOSPATIAL / CENSO ARBÓREO ENDPOINTS
// ============================================================================

// Helper function to parse CSV - SEM PROCESSAMENTO, APENAS LÊ
// Lida com campos entre aspas que contêm vírgulas e aspas duplas escapadas
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const obj = {};
    const values = [];
    let currentValue = '';
    let insideQuotes = false;
    
    // Parse manual respeitando aspas
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Aspas duplas escapadas ("")
          currentValue += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        // Fim do campo
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Último campo
    values.push(currentValue.trim());
    
    // Mapear valores para headers
    headers.forEach((header, i) => {
      obj[header] = values[i] || '';
    });
    
    return obj;
  });
}

// GET /api/geo/trees/points - APENAS LÊ CSV PROCESSADO
app.get('/api/geo/trees/points', async (req, res) => {
  try {
    const { limit = 5000, offset = 0, bairro } = req.query;
    
    const fs = await import('fs');
    const path = await import('path');
    
    const csvPath = path.join('/data', 'censo_arboreo_processed.csv');
    
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({
        message: 'CSV file not found',
        success: false
      });
    }

    // LER CSV - SEM PROCESSAMENTO
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    let trees = parseCSV(csvData);
    
    // Filter by bairro if specified
    if (bairro) {
      trees = trees.filter(t => t.bairro_nome === bairro);
    }
    
    // Apply pagination
    const startIdx = parseInt(offset);
    const endIdx = startIdx + parseInt(limit);
    const paginatedTrees = trees.slice(startIdx, endIdx);
    
    // Convert to GeoJSON format
    const features = paginatedTrees.map(tree => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [tree.lng, tree.lat]
      },
      properties: {
        nome_popul: tree.nome_popul,
        altura: tree.altura,
        dap: tree.dap,
        copa: tree.copa,
        porte_esp: tree.porte_esp,
        bairro_nome: tree.bairro_nome,
        rpa: tree.rpa
      }
    }));

    res.json({
      data: {
        type: 'FeatureCollection',
        features,
        metadata: {
          total: trees.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          returned: features.length
        }
      },
      message: 'Tree points retrieved successfully',
      success: true
    });
  } catch (error) {
    console.error('Error fetching tree points:', error);
    res.status(500).json({
      message: 'Failed to retrieve tree points',
      success: false,
      error: error.message
    });
  }
});

// GET /api/geo/bairros - Get neighborhoods boundaries (polygons)
// Returns: GeoJSON FeatureCollection with bairro polygons
app.get('/api/geo/bairros', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const bairrosPath = path.join('/data', 'bairros.geojson');
    
    if (!fs.existsSync(bairrosPath)) {
      return res.status(404).json({
        message: 'Bairros GeoJSON file not found',
        success: false
      });
    }

    const bairrosData = JSON.parse(fs.readFileSync(bairrosPath, 'utf-8'));

    res.json({
      data: bairrosData,
      message: 'Bairros boundaries retrieved successfully',
      success: true
    });
  } catch (error) {
    console.error('Error fetching bairros:', error);
    res.status(500).json({
      message: 'Failed to retrieve bairros',
      success: false,
      error: error.message
    });
  }
});

// GET /api/geo/trees/by-bairro - APENAS LÊ CSV AGREGADO
app.get('/api/geo/trees/by-bairro', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const csvPath = path.join('/data', 'bairro_stats.csv');
    
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({
        message: 'Bairro stats CSV not found',
        success: false
      });
    }

    // LER CSV AGREGADO - SEM PROCESSAMENTO
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const result = parseCSV(csvData).map(row => ({
      bairro: row.bairro,
      sigla: row.bairro, // CSV não tem sigla separada
      rpa: row.rpa,
      quantidade: parseInt(row.quantidade),
      densidade: parseFloat(row.densidade), // Usar a densidade já calculada
      mediaAltura: parseFloat(row.mediaAltura),
      mediaDap: parseFloat(row.mediaDap),
      mediaCopa: parseFloat(row.mediaCopa),
      portes: JSON.parse(row.portes), // Parse do JSON que está no CSV
      topEspecies: JSON.parse(row.topEspecies) // Parse do JSON que está no CSV
    }));

    res.json({
      data: result,
      message: 'Tree statistics by bairro retrieved successfully',
      success: true,
      metadata: {
        totalBairros: result.length,
        totalArvores: result.reduce((sum, b) => sum + b.quantidade, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching trees by bairro:', error);
    res.status(500).json({
      message: 'Failed to retrieve trees by bairro',
      success: false,
      error: error.message
    });
  }
});

// GET /api/geo/trees/heatmap - APENAS LÊ CSV AGREGADO
app.get('/api/geo/trees/heatmap', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const csvPath = path.join('/data', 'heatmap_data.csv');
    
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({
        message: 'Heatmap data CSV not found',
        success: false
      });
    }

    // LER CSV AGREGADO - SEM PROCESSAMENTO
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const coordinates = parseCSV(csvData).map(row => ({
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      weight: 1
    }));

    res.json({
      data: coordinates,
      message: 'Heatmap data retrieved successfully',
      success: true,
      metadata: {
        total: coordinates.length,
        sampled: coordinates.length
      }
    });
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({
      message: 'Failed to retrieve heatmap data',
      success: false,
      error: error.message
    });
  }
});

// GET /api/geo/trees/stats - APENAS LÊ CSV AGREGADO
app.get('/api/geo/trees/stats', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const csvPath = path.join('/data', 'global_stats.csv');
    
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({
        message: 'Global stats CSV not found',
        success: false
      });
    }

    // LER CSV AGREGADO - SEM PROCESSAMENTO
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(csvData);
    
    if (rows.length === 0) {
      return res.status(500).json({
        message: 'Global stats CSV is empty',
        success: false
      });
    }
    
    const statsRow = rows[0]; // Só tem uma linha no global_stats.csv
    
    const result = {
      totalArvores: parseInt(statsRow.totalArvores),
      distribuicao: {
        porPorte: JSON.parse(statsRow.distribuicaoPorte),
        porRpa: JSON.parse(statsRow.distribuicaoRpa),
        porTipologia: {} // Não temos isso no CSV, retornar vazio
      },
      topEspecies: JSON.parse(statsRow.topEspecies),
      totalEspecies: parseInt(statsRow.totalEspecies),
      caracteristicas: {
        altura: { media: parseFloat(statsRow.alturaMedia) },
        dap: { media: parseFloat(statsRow.dapMedio) },
        copa: { media: parseFloat(statsRow.copaMedia) }
      }
    };

    res.json({
      data: result,
      message: 'Tree census statistics retrieved successfully',
      success: true
    });
  } catch (error) {
    console.error('Error fetching tree statistics:', error);
    res.status(500).json({
      message: 'Failed to retrieve tree statistics',
      success: false,
      error: error.message
    });
  }
});

// Start server
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📊 Database connected and migrated`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();