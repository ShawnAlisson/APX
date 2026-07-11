import type { BattleOption } from "@/lib/battle-types";

type FoodCatalogEntry = {
  imageUrl: string;
  keywords: string[];
};

const FOOD_CATALOG: FoodCatalogEntry[] = [
  {
    imageUrl: "/food/pics/joseph-gonzalez-zcUgjyqEwe8-unsplash.jpg",
    keywords: ["pancake", "waffle", "berry", "strawberry", "brunch"],
  },
  {
    imageUrl: "/food/pics/casey-lee-awj7sRviVXo-unsplash.jpg",
    keywords: ["brownie", "cookie", "chocolate", "sundae", "fudge"],
  },
  {
    imageUrl: "/food/pics/michele-blackwell-rAyCBQTH7ws-unsplash.jpg",
    keywords: ["cheesecake", "shake", "milkshake", "cream", "dessert", "lotus"],
  },
  {
    imageUrl: "/food/pics/khloe-arledge-ND3edEmzcdQ-unsplash.jpg",
    keywords: ["burger", "fries", "beef", "chicken burger", "loaded"],
  },
  {
    imageUrl: "/food/pics/alexandra-kusper-7MqA9uQZc2Y-unsplash.jpg",
    keywords: ["pasta", "lasagne", "gnocchi", "parmesan", "bake"],
  },
  {
    imageUrl: "/food/pics/anh-nguyen-kcA-c3f_3FE-unsplash.jpg",
    keywords: ["sandwich", "toastie", "panini", "club", "wrap"],
  },
];

const FALLBACK_IMAGES = FOOD_CATALOG.map((entry) => entry.imageUrl);

export function getFoodImageForText(text: string, index = 0) {
  const lower = text.toLowerCase();
  const match = FOOD_CATALOG.find((entry) =>
    entry.keywords.some((keyword) => lower.includes(keyword)),
  );

  return match?.imageUrl ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

export function normalizeBattleOptions(options: BattleOption[]) {
  return options.map((option, index) => ({
    ...option,
    imageUrl:
      option.imageUrl ??
      getFoodImageForText(`${option.name} ${option.description}`, index),
  }));
}
