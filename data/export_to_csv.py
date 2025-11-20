#!/usr/bin/env python3
"""
Script para exportar dados processados do censo arbóreo para CSV
Este script lê os GeoJSON files e cria CSVs otimizados para a API
"""

import json
import pandas as pd
from pathlib import Path

print("=" * 80)
print("EXPORTAÇÃO DE DADOS DO CENSO ARBÓREO PARA CSV")
print("=" * 80)

# Diretório de dados
DATA_DIR = Path(__file__).parent

# 1. Carregar censo_arboreo.geojson
print("\n1. Carregando censo_arboreo.geojson...")
with open(DATA_DIR / "censo_arboreo.geojson", "r", encoding="utf-8") as f:
    censo_data = json.load(f)

print(f"   ✅ {len(censo_data['features'])} árvores carregadas")

# 2. Converter para DataFrame
print("\n2. Convertendo para DataFrame...")
records = []
for feature in censo_data["features"]:
    props = feature["properties"]
    geom = feature["geometry"]

    records.append(
        {
            "nome_popul": props.get("nome_popul", ""),
            "nome_sp": props.get("nome_sp", ""),
            "altura": props.get("altura", 0),
            "dap": props.get("dap", 0),
            "copa": props.get("copa", 0),
            "cap": props.get("cap", 0),
            "porte_esp": props.get("porte_esp", ""),
            "bairro": props.get("bairro", ""),
            "bairro_nome": props.get("bairro_nome", ""),
            "rpa": props.get("rpa", ""),
            "tipologia": props.get("tipologia", ""),
            "lng": geom["coordinates"][0],
            "lat": geom["coordinates"][1],
        }
    )

df = pd.DataFrame(records)
print(f"   ✅ DataFrame criado: {df.shape[0]} linhas x {df.shape[1]} colunas")

# 3. Exportar censo_arboreo_processed.csv
print("\n3. Exportando censo_arboreo_processed.csv...")
df.to_csv(DATA_DIR / "censo_arboreo_processed.csv", index=False, encoding="utf-8")
print(f"   ✅ Arquivo salvo ({df.shape[0]} registros)")

# 4. Calcular estatísticas por bairro
print("\n4. Calculando estatísticas por bairro...")
bairro_groups = df.groupby("bairro_nome")

bairro_stats_list = []
for bairro_nome, group in bairro_groups:
    # Estatísticas básicas
    stats = {
        "bairro": bairro_nome,
        "rpa": group["rpa"].mode()[0] if len(group["rpa"].mode()) > 0 else "",
        "quantidade": len(group),
        "altura_media": group["altura"].mean(),
        "altura_min": group["altura"].min(),
        "altura_max": group["altura"].max(),
        "altura_mediana": group["altura"].median(),
        "dap_medio": group["dap"].mean(),
        "dap_min": group["dap"].min(),
        "dap_max": group["dap"].max(),
        "dap_mediana": group["dap"].median(),
        "copa_media": group["copa"].mean(),
        "copa_min": group["copa"].min(),
        "copa_max": group["copa"].max(),
        "copa_mediana": group["copa"].median(),
        "cap_medio": group["cap"].mean(),
    }

    # Top espécies
    top_especies = group["nome_popul"].value_counts().head(5).to_dict()
    stats["top_especies_json"] = json.dumps(top_especies, ensure_ascii=False)

    # Distribuição de porte
    porte_dist = group["porte_esp"].value_counts().to_dict()
    stats["portes_json"] = json.dumps(porte_dist, ensure_ascii=False)

    bairro_stats_list.append(stats)

bairro_stats_df = pd.DataFrame(bairro_stats_list)
bairro_stats_df = bairro_stats_df.sort_values("quantidade", ascending=False)
bairro_stats_df.to_csv(DATA_DIR / "bairro_stats.csv", index=False, encoding="utf-8")
print(f"   ✅ Arquivo salvo: bairro_stats.csv ({len(bairro_stats_df)} bairros)")

# 5. Calcular estatísticas globais
print("\n5. Calculando estatísticas globais...")
global_stats = {
    "total_arvores": len(df),
    "total_especies": df["nome_popul"].nunique(),
    "altura_media": df["altura"].mean(),
    "altura_min": df["altura"].min(),
    "altura_max": df["altura"].max(),
    "altura_mediana": df["altura"].median(),
    "dap_medio": df["dap"].mean(),
    "dap_min": df["dap"].min(),
    "dap_max": df["dap"].max(),
    "dap_mediana": df["dap"].median(),
    "copa_media": df["copa"].mean(),
    "copa_min": df["copa"].min(),
    "copa_max": df["copa"].max(),
    "copa_mediana": df["copa"].median(),
    "cap_medio": df["cap"].mean(),
}

# Distribuições
distribuicao_porte = df["porte_esp"].value_counts().to_dict()
distribuicao_rpa = df["rpa"].value_counts().to_dict()
distribuicao_tipologia = df["tipologia"].value_counts().to_dict()
top_10_especies = df["nome_popul"].value_counts().head(10).to_dict()

global_stats["distribuicao_porte_json"] = json.dumps(
    distribuicao_porte, ensure_ascii=False
)
global_stats["distribuicao_rpa_json"] = json.dumps(distribuicao_rpa, ensure_ascii=False)
global_stats["distribuicao_tipologia_json"] = json.dumps(
    distribuicao_tipologia, ensure_ascii=False
)
global_stats["top_10_especies_json"] = json.dumps(top_10_especies, ensure_ascii=False)

global_stats_df = pd.DataFrame([global_stats])
global_stats_df.to_csv(DATA_DIR / "global_stats.csv", index=False, encoding="utf-8")
print(f"   ✅ Arquivo salvo: global_stats.csv")

# 6. Criar dados para heatmap (amostra)
print("\n6. Criando dados para heatmap (amostra de 10.000)...")
sample_size = min(10000, len(df))
df_heatmap = df[["bairro_nome", "nome_popul", "altura", "dap", "lng", "lat"]].sample(
    n=sample_size, random_state=42
)
df_heatmap.to_csv(DATA_DIR / "heatmap_data.csv", index=False, encoding="utf-8")
print(f"   ✅ Arquivo salvo: heatmap_data.csv ({len(df_heatmap)} pontos)")

print("\n" + "=" * 80)
print("EXPORTAÇÃO CONCLUÍDA COM SUCESSO!")
print("=" * 80)
print(
    """
Arquivos gerados:
  ✅ censo_arboreo_processed.csv
  ✅ bairro_stats.csv  
  ✅ global_stats.csv
  ✅ heatmap_data.csv
"""
)
print("Próximo passo: Atualizar backend/index.js para usar esses CSVs")
print("=" * 80)
