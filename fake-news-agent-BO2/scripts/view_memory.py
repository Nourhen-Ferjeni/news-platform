import sqlite3
import pandas as pd

# Connexion à la base SQLite
conn = sqlite3.connect("data/memory.db")

# Lire la table 'history'
df = pd.read_sql_query("SELECT * FROM history ORDER BY date DESC", conn)

# Afficher le résultat
print(df)

conn.close()
