import csv

# Read CSV and show headers
with open('totcat-centres-educatius.csv', 'r', encoding='latin-1') as f:
    reader = csv.DictReader(f, delimiter=';')
    
    # First, show the headers
    print("CSV Headers:")
    print(reader.fieldnames)
    print("\n" + "="*120 + "\n")
    
    barcelona_centers = []
    
    for row in reader:
        # Use the correct column name from headers
        if row.get('Nom_municipi', '') == 'Barcelona':
            barcelona_centers.append(row)
            if len(barcelona_centers) >= 40:  # Limit to 40 centers
                break
    
    # Display the first 40 Barcelona centers
    print(f"Found {len(barcelona_centers)} Barcelona centers\n")
    print("-" * 120)
    
    for i, center in enumerate(barcelona_centers, 1):
        code = center.get('Codi_centre', 'N/A')
        name = center.get('Denominació_completa', 'N/A')
        address = center.get('Adreça', 'N/A')
        postal_code = center.get('Codi_postal', 'N/A')
        phone = center.get('Telèfon', 'N/A')
        email = center.get('E-mail_centre', 'N/A')
        
        print(f"{i:2}. {code:10} | {name[:50]:50} | {address[:40]:40}")
        if i <= 5:  # Show more detail for first 5
            print(f"    CP: {postal_code} | Phone: {phone} | Email: {email}")
        print()
