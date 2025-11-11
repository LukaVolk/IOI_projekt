from pathlib import Path
import csv

INPUT_DIR = Path("Podatki_Raw")  # folder with your CSVs
OUTPUT_FILE = Path("pm10_data.csv")

fieldnames = ["datum_zajema", "vrednost", "mesto"]

with OUTPUT_FILE.open("w", newline="", encoding="utf-8") as out_f:
    writer = csv.DictWriter(out_f, fieldnames=fieldnames)
    writer.writeheader()

    for csv_path in INPUT_DIR.glob("*.csv"):
        # only files with code 18247 in the name (PM10)
        if "18247" not in csv_path.stem:
            continue

        # extract "mesto" from filename
        # e.g. tabela_2022_CE bolnica_18247.csv
        parts = csv_path.stem.split("_")
        mesto = "_".join(parts[2:-1]).strip()

        with csv_path.open("r", newline="", encoding="utf-8") as in_f:
            reader = csv.reader(in_f)

            # skip the weird header line (d,a,t,u,m,...)
            next(reader, None)

            for row in reader:
                # expected row: [datum, vrednost, veljavnost, popravljen]
                if len(row) < 4:
                    continue

                veljavnost = row[2].strip()
                if veljavnost != "1":
                    continue  # keep only veljavnost == 1

                writer.writerow({
                    "datum_zajema": row[0].strip(),
                    "vrednost": row[1].strip(),
                    "mesto": mesto,
                })

print(f"Done. Output written to {OUTPUT_FILE}")