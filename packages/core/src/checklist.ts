export type ChecklistCategory =
  | "navigation"
  | "vetements"
  | "bivouac"
  | "securite"
  | "nourriture"
  | "trousse";

export type ChecklistItem = {
  id: string;
  name: string;
  category: ChecklistCategory;
  weightGrams?: number;
  essential: boolean;
};

export type ChecklistContext = {
  durationDays: number;
  hasBivouac: boolean;
  season: "ete" | "hiver" | "mi-saison";
  maxAltitude: number;
};

const BASE_ITEMS: ChecklistItem[] = [
  { id: "carte-topo", name: "Carte topographique", category: "navigation", weightGrams: 80, essential: true },
  { id: "boussole", name: "Boussole", category: "navigation", weightGrams: 50, essential: true },
  { id: "gps", name: "GPS / smartphone", category: "navigation", weightGrams: 180, essential: true },
  { id: "powerbank", name: "Batterie externe", category: "navigation", weightGrams: 200, essential: false },

  { id: "chaussures", name: "Chaussures de randonnée", category: "vetements", weightGrams: 900, essential: true },
  { id: "chaussettes", name: "Chaussettes techniques", category: "vetements", weightGrams: 80, essential: true },
  { id: "pantalon", name: "Pantalon de rando", category: "vetements", weightGrams: 350, essential: true },
  { id: "tshirt", name: "T-shirt technique", category: "vetements", weightGrams: 150, essential: true },
  { id: "coupe-vent", name: "Coupe-vent / veste imperméable", category: "vetements", weightGrams: 400, essential: true },
  { id: "casquette", name: "Casquette / chapeau", category: "vetements", weightGrams: 90, essential: false },
  { id: "lunettes", name: "Lunettes de soleil", category: "vetements", weightGrams: 30, essential: false },
  { id: "gants", name: "Gants", category: "vetements", weightGrams: 80, essential: false },
  { id: "buff", name: "Buff / tour de cou", category: "vetements", weightGrams: 40, essential: false },

  { id: "trousse-pharmacie", name: "Trousse de premiers secours", category: "trousse", weightGrams: 200, essential: true },
  { id: "bandes", name: "Bandes élastiques", category: "trousse", weightGrams: 60, essential: true },
  { id: "antiseptique", name: "Antiseptique", category: "trousse", weightGrams: 50, essential: true },
  { id: "aspirine", name: "Antidouleur (ibuprofène)", category: "trousse", weightGrams: 30, essential: true },
  { id: "pansements", name: "Pansements / compresses", category: "trousse", weightGrams: 40, essential: true },
  { id: "ciseaux", name: "Ciseaux", category: "trousse", weightGrams: 20, essential: false },

  { id: "eau", name: "Eau (2L minimum)", category: "nourriture", weightGrams: 2000, essential: true },
  { id: "purif", name: "Pastilles purification eau", category: "nourriture", weightGrams: 20, essential: false },
  { id: "barres", name: "Barres énergétiques", category: "nourriture", weightGrams: 200, essential: true },
  { id: "repas", name: "Repas du midi", category: "nourriture", weightGrams: 400, essential: true },

  { id: "sac", name: "Sac à dos adapté", category: "securite", weightGrams: 1200, essential: true },
  { id: "sifflet", name: "Sifflet de détresse", category: "securite", weightGrams: 15, essential: true },
  { id: "lampe", name: "Lampe frontale + piles", category: "securite", weightGrams: 100, essential: true },
  { id: "couverture-survie", name: "Couverture de survie", category: "securite", weightGrams: 50, essential: true },
  { id: "couteau", name: "Couteau multifonction", category: "securite", weightGrams: 80, essential: false },
  { id: "allumettes", name: "Allumettes / briquet", category: "securite", weightGrams: 20, essential: false },
  { id: "corde", name: "Corde légère 10m", category: "securite", weightGrams: 200, essential: false },
  { id: "baton", name: "Bâtons de marche", category: "securite", weightGrams: 400, essential: false },
];

const BIVOUAC_ITEMS: ChecklistItem[] = [
  { id: "tente", name: "Tente / bivouac", category: "bivouac", weightGrams: 1800, essential: true },
  { id: "duvet", name: "Sac de couchage", category: "bivouac", weightGrams: 900, essential: true },
  { id: "matelas", name: "Matelas isolant", category: "bivouac", weightGrams: 500, essential: true },
  { id: "rechaud", name: "Réchaud + gaz", category: "bivouac", weightGrams: 350, essential: true },
  { id: "gamelle", name: "Gamelle / couverts", category: "bivouac", weightGrams: 200, essential: true },
  { id: "allume-feu", name: "Allume-feu", category: "bivouac", weightGrams: 30, essential: false },
];

const WINTER_ITEMS: ChecklistItem[] = [
  { id: "crampons", name: "Crampons", category: "vetements", weightGrams: 800, essential: true },
  { id: "piolet", name: "Piolet", category: "securite", weightGrams: 500, essential: true },
  { id: "guetres", name: "Guêtres", category: "vetements", weightGrams: 300, essential: true },
  { id: "veste-grand-froid", name: "Veste grand froid (duvet)", category: "vetements", weightGrams: 600, essential: true },
  { id: "bonnet", name: "Bonnet chaud", category: "vetements", weightGrams: 60, essential: true },
  { id: "gants-chauds", name: "Gants chauds / moufles", category: "vetements", weightGrams: 150, essential: true },
];

const HIGH_ALTITUDE_ITEMS: ChecklistItem[] = [
  { id: "sous-couche-thermique", name: "Sous-couche thermique", category: "vetements", weightGrams: 200, essential: true },
  { id: "creme-solaire-haute", name: "Crème solaire indice 50+", category: "trousse", weightGrams: 100, essential: true },
  { id: "casque", name: "Casque de protection", category: "securite", weightGrams: 300, essential: false },
];

export function generateChecklist(ctx: ChecklistContext): ChecklistItem[] {
  const items: ChecklistItem[] = [...BASE_ITEMS];

  if (ctx.hasBivouac) {
    items.push(...BIVOUAC_ITEMS);
  }

  if (ctx.season === "hiver") {
    items.push(...WINTER_ITEMS);
  } else if (ctx.season === "mi-saison") {
    items.push(
      { id: "mid-fleece", name: "Polaire mid-layer", category: "vetements", weightGrams: 300, essential: true },
      { id: "mid-bonnet", name: "Bonnet léger", category: "vetements", weightGrams: 40, essential: false }
    );
  }

  if (ctx.maxAltitude > 2500) {
    items.push(...HIGH_ALTITUDE_ITEMS);
  }

  if (ctx.durationDays > 1) {
    items.push(
      { id: "repas-extra", name: "Repas supplémentaires (lyophilisés)", category: "nourriture", weightGrams: ctx.durationDays * 300, essential: true },
      { id: "snacks", name: "Snacks / fruits secs", category: "nourriture", weightGrams: ctx.durationDays * 150, essential: true }
    );
  }

  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
