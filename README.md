# FilmCost Pro

FilmCost Pro is a bilingual Arabic/English calculator for ABA / A-B-A plastic film factories. It calculates the raw-material cost per kg of plastic film based on Extruder A recipe, Extruder B recipe, A/B draw ratio, size/thickness preset, and waste percentage.

## What The App Does

- Manage raw materials and prices.
- Support Egyptian market names and scientific English names for materials.
- Create Extruder A recipes.
- Create Extruder B recipes.
- Create size/thickness presets.
- Calculate film raw-material cost per kg.
- Apply waste percentage.
- Preview profit per kg if selling price is entered.
- Compare two different setups.
- Save data locally.
- Export/import data as JSON.
- Support Arabic RTL and English LTR.

## What The App Does Not Do

- It is not ERP software.
- It is not accounting software.
- It is not inventory management software.
- It does not calculate electricity.
- It does not calculate labor.
- It does not calculate maintenance.
- It does not calculate rent.
- It does not calculate machine depreciation.
- It does not calculate transport.
- It does not include external operating costs.

## Setup

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Run linting:

```bash
npm run lint
```

## Main Formulas

Recipe cost:

```text
recipeCost = sum(materialPrice * materialPercentage / 100)
```

A/B ratios:

```text
aRatio = drawA / (drawA + drawB)
bRatio = drawB / (drawA + drawB)
```

Film cost before waste:

```text
filmCostBeforeWaste = recipeACost * aRatio + recipeBCost * bRatio
```

Film cost after waste:

```text
filmCostAfterWaste = filmCostBeforeWaste / (1 - wastePercent / 100)
```

Profit preview:

```text
profitPerKg = sellingPricePerKg - filmCostAfterWaste
totalProfit = profitPerKg * orderQuantityKg
```

Safe selling price:

```text
safePrice = filmCostAfterWaste * (1 + targetProfitMarginPercent / 100)
```

## Demo Data

Demo materials include:

- سابك / SABIC Polyethylene Grade
- مخرز / Recycled PE / Reprocessed Polyethylene
- لو + لينير / LDPE + LLDPE Blend
- صبغة أسود / Black Masterbatch
- أوميا / Calcium Carbonate / CaCO3 Filler
- خامة B غالية / Expensive B material

Demo Recipe A:

- Sabic 48.08%
- Makhraz 38.46%
- Low + Linear 9.62%
- Black pigment 3.85%

Demo Recipe B:

- Omya 87.21%
- Expensive B material 5.81%
- Makhraz 5.81%
- Black pigment 1.16%

Demo preset:

- A draw = 10 kg
- B draw = 45 kg
- Roll weight = 55 kg
- Waste = 1%

Expected demo result:

- Recipe A cost ≈ 90.48 EGP/kg
- Recipe B cost ≈ 31.40 EGP/kg
- A ratio ≈ 18.18%
- B ratio ≈ 81.82%
- Film cost before waste ≈ 42.14 EGP/kg
- Film cost after 1% waste ≈ 42.57 EGP/kg

## Material Naming System

Every raw material has:

- `marketNameAr`: Egyptian market/common Arabic name
- `scientificNameEn`: scientific/common English name
- `pricePerKg`
- `usage`
- `category`
- `notes`

The app supports a material display setting called `materialNameDisplayMode`:

- `marketOnly`: show only the Egyptian market/common Arabic name.
- `englishOnly`: show only the scientific/common English name.
- `both`: show the Arabic market name and English scientific name together.

This display setting affects the UI only. Calculations always use `pricePerKg` and recipe percentages.

## Data Persistence

The MVP stores all app data in browser `localStorage`.

Saved data includes:

- Materials
- Recipes
- Presets
- Settings
- Recent calculations
- Calculator and compare setup state

The app supports JSON export/import so users can back up or move their local data. A later production version can upgrade persistence to a cloud database such as Supabase/PostgreSQL without changing the core raw-material cost formulas.

## Future Improvements

- User accounts
- Cloud database
- PDF quotation export
- Factory history
- Cost comparison history
- AI assistant later
- More factory-specific presets
