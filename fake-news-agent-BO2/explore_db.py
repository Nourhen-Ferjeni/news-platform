import sqlite3
import pandas as pd

# Connexion à la base SQLite
db_path = r"C:\Users\Lenovo\OneDrive - ESPRIT\Bureau\Projet_Pi\fake-news-agent-BO2\data\memory.db"
conn = sqlite3.connect(db_path)

# Liste des tables
tables = pd.read_sql_query("SELECT name FROM sqlite_master WHERE type='table';", conn)
print("📋 Tables disponibles :")
print(tables)

# Exemple : afficher les 10 premières lignes d'une table (remplace nom_table par la tienne)
nom_table = tables['name'][0]  # première table
print(f"\n🔍 Aperçu de la table '{nom_table}' :")
df = pd.read_sql_query(f"SELECT * FROM {nom_table} LIMIT 10;", conn)
print(df)

# Fermer la connexion
conn.close()
