(function () {
  function normalizeText(value) {
    return String(value ?? "").trim();
  }

  function normalizeAmount(value) {
    if (value === null || value === undefined) return 0;

    const cleaned = String(value)
      .replace(/\s/g, "")
      .replace("Ft", "")
      .replace("HUF", "")
      .replace(/\./g, "")
      .replace(",", ".");

    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  }

  function normalizeDate(value) {
    const raw = normalizeText(value);
    if (!raw) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

    const dotted = raw.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})\.?$/);
    if (dotted) {
      const y = dotted[1];
      const m = dotted[2].padStart(2, "0");
      const d = dotted[3].padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    const slash = raw.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (slash) {
      const y = slash[1];
      const m = slash[2].padStart(2, "0");
      const d = slash[3].padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    return raw;
  }

  function mapCsvRow(row) {
    return {
      datum: normalizeDate(row.datum),
      partner: normalizeText(row.partner),
      osszeg: normalizeAmount(row.osszeg),
      penznem: normalizeText(row.penznem || "HUF"),
      jogcim: normalizeText(row.jogcim),
      bizonylatszam: normalizeText(row.bizonylatszam),
      kategoria: normalizeText(row.kategoria)
    };
  }

  async function parseCsvFile(file, papa) {
    return new Promise((resolve, reject) => {
      if (!papa) {
        reject(new Error("A PapaParse példány nincs átadva."));
        return;
      }

      papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete(results) {
          try {
            const rows = (results.data || []).map(mapCsvRow);
            resolve(rows);
          } catch (err) {
            reject(err);
          }
        },
        error(error) {
          reject(error);
        }
      });
    });
  }

  window.HazpenztarCsvImport = {
    parseCsvFile
  };
})();