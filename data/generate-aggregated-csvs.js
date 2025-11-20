#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// console.log('Gerando CSVs agregados a partir do censo_arboreo_processed.csv...\n');

// Ler CSV processado
const csvPath = path.join(__dirname, 'censo_arboreo_processed.csv');
const csvData = fs.readFileSync(csvPath, 'utf-8');
const lines = csvData.trim().split('\n');
const headers = lines[0].split(',');

const trees = lines.slice(1).map(line => {
  const values = line.split(',');
  const obj = {};
  headers.forEach((header, i) => {
    let value = values[i];
    if (!isNaN(value) && value !== '') value = parseFloat(value);
    obj[header] = value;
  });
  return obj;
});

// console.log(`✅ ${trees.length} árvores carregadas\n`);

// AGREGAR POR BAIRRO - SEM PROCESSAMENTO COMPLEXO
const bairroMap = {};
trees.forEach(tree => {
  const bairro = tree.bairro_nome;
  if (!bairro || bairro === '') return;
  
  if (!bairroMap[bairro]) {
    bairroMap[bairro] = {
      bairro,
      rpa: tree.rpa,
      quantidade: 0,
      alturas: [],
      daps: [],
      copas: [],
      especies: {},
      portes: {}
    };
  }
  
  const stats = bairroMap[bairro];
  stats.quantidade++;
  if (tree.altura > 0) stats.alturas.push(tree.altura);
  if (tree.dap > 0) stats.daps.push(tree.dap);
  if (tree.copa > 0) stats.copas.push(tree.copa);
  
  if (tree.nome_popul) stats.especies[tree.nome_popul] = (stats.especies[tree.nome_popul] || 0) + 1;
  if (tree.porte_esp) stats.portes[tree.porte_esp] = (stats.portes[tree.porte_esp] || 0) + 1;
});

// Função para calcular a área de um polígono GeoJSON (sem dependências externas)
// Implementação baseada no algoritmo Shoelace com conversão para m²
function calculatePolygonArea(coordinates) {
  let area = 0;
  
  if (!coordinates || !coordinates.length || !coordinates[0].length) {
    return 0;
  }

  const points = coordinates[0];
  if (points.length < 3) {
    return 0;
  }

  // Achar a latitude média para a conversão de longitude para metros
  const avgLat = points.reduce((sum, p) => sum + p[1], 0) / points.length;
  const metersPerDegree = 111132.954 - 559.822 * Math.cos(2 * avgLat * Math.PI / 180) + 1.175 * Math.cos(4 * avgLat * Math.PI / 180);
  const metersPerDegreeLon = metersPerDegree * Math.cos(avgLat * Math.PI / 180);

  const projectedPoints = points.map(p => [
    p[0] * metersPerDegreeLon,
    p[1] * metersPerDegree
  ]);

  for (let i = 0; i < projectedPoints.length - 1; i++) {
    const [x1, y1] = projectedPoints[i];
    const [x2, y2] = projectedPoints[i + 1];
    area += (x1 * y2 - x2 * y1);
  }
  
  const [x_last, y_last] = projectedPoints[projectedPoints.length - 1];
  const [x_first, y_first] = projectedPoints[0];
  area += (x_last * y_first - x_first * y_last);

  return Math.abs(area / 2); // Área em metros quadrados
}

// Estatísticas por bairro
const areasBairros = {};
const bairroStats = Object.values(bairroMap).map(stats => {
  const avg = arr => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  
  const topEspecies = Object.entries(stats.especies)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([nome, quantidade]) => ({ nome, quantidade }));
  
  const areaBairro = areasBairros[stats.bairro] || 1;
  const areaKm2 = areaBairro / 1000000;
  const densidade = areaKm2 > 0 ? (stats.quantidade / areaKm2).toFixed(2) : 0; // árvores por km²

  return {
    bairro: stats.bairro,
    rpa: stats.rpa || '',
    quantidade: stats.quantidade,
    mediaAltura: parseFloat(avg(stats.alturas).toFixed(2)),
    mediaDap: parseFloat(avg(stats.daps).toFixed(2)),
    mediaCopa: parseFloat(avg(stats.copas).toFixed(2)),
    topEspecies: JSON.stringify(topEspecies),
    portes: JSON.stringify(stats.portes),
    area: areaBairro.toFixed(2),
    densidade
  };
}).sort((a, b) => b.quantidade - a.quantidade);

// Salvar bairro_stats.csv
const bairroCSV = [
  'bairro,rpa,quantidade,mediaAltura,mediaDap,mediaCopa,topEspecies,portes,area,densidade',
  ...bairroStats.map(b => 
    `"${b.bairro}","${b.rpa}",${b.quantidade},${b.mediaAltura},${b.mediaDap},${b.mediaCopa},"${b.topEspecies.replace(/"/g, '""')}","${b.portes.replace(/"/g, '""')}",${b.area},${b.densidade}`
  )
].join('\n');

fs.writeFileSync(path.join(__dirname, 'bairro_stats.csv'), bairroCSV);
console.log(`✅ bairro_stats.csv gerado (${bairroStats.length} bairros)`);

// Estatísticas globais
const globalStats = {
  totalArvores: trees.length,
  totalEspecies: new Set(trees.map(t => t.nome_popul).filter(Boolean)).size,
  alturaMedia: parseFloat((trees.reduce((sum, t) => sum + (t.altura || 0), 0) / trees.length).toFixed(2)),
  dapMedio: parseFloat((trees.reduce((sum, t) => sum + (t.dap || 0), 0) / trees.length).toFixed(2)),
  copaMedia: parseFloat((trees.reduce((sum, t) => sum + (t.copa || 0), 0) / trees.length).toFixed(2))
};

// Distribuições
const porteCount = {};
const rpaCount = {};
const especieCount = {};

trees.forEach(t => {
  if (t.porte_esp) porteCount[t.porte_esp] = (porteCount[t.porte_esp] || 0) + 1;
  if (t.rpa) rpaCount[t.rpa] = (rpaCount[t.rpa] || 0) + 1;
  if (t.nome_popul) especieCount[t.nome_popul] = (especieCount[t.nome_popul] || 0) + 1;
});

const topEspecies = Object.entries(especieCount)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)
  .map(([nome, quantidade]) => ({ nome, quantidade }));

const globalCSV = [
  'totalArvores,totalEspecies,alturaMedia,dapMedio,copaMedia,distribuicaoPorte,distribuicaoRpa,topEspecies',
  `${globalStats.totalArvores},${globalStats.totalEspecies},${globalStats.alturaMedia},${globalStats.dapMedio},${globalStats.copaMedia},"${JSON.stringify(porteCount).replace(/"/g, '""')}","${JSON.stringify(rpaCount).replace(/"/g, '""')}","${JSON.stringify(topEspecies).replace(/"/g, '""')}"`
].join('\n');

fs.writeFileSync(path.join(__dirname, 'global_stats.csv'), globalCSV);
console.log(`✅ global_stats.csv gerado`);

// Heatmap (amostra)
const sampleSize = Math.min(10000, trees.length);
const shuffled = [...trees].sort(() => 0.5 - Math.random()).slice(0, sampleSize);
const heatmapCSV = [
  'lat,lng',
  ...shuffled.map(t => `${t.lat},${t.lng}`)
].join('\n');

fs.writeFileSync(path.join(__dirname, 'heatmap_data.csv'), heatmapCSV);
console.log(`✅ heatmap_data.csv gerado (${sampleSize} pontos)`);

console.log('\n✅ Todos os CSVs agregados foram gerados com sucesso!');
