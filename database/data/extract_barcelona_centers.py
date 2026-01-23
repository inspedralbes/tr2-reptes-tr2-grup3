import pandas as pd

# 1. Cargar el archivo con el delimitador correcto (punto y coma)
df = pd.read_csv('totcat-centres-educatius.csv', sep=';', encoding='latin-1')

# 2. Filtrar por municipio "Barcelona" y centros que tengan marcada la columna "ESO"
# Nota: La columna ESO contiene el texto 'ESO' si el centro imparte ese nivel
resultado = df[(df['Nom_municipi'] == 'Barcelona') & (df['ESO'] == 'ESO')]

# 3. Guardar el resultado en un nuevo archivo
resultado.to_csv('centros_secundaria_barcelona.csv', index=False, sep=';')