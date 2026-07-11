import type { BattleOption } from "@/lib/battle-types";

type FoodCatalogEntry = {
  imageUrl: string;
  keywords: string[];
};

const FOOD_CATALOG: FoodCatalogEntry[] = [
  {
    imageUrl: "/food/strawberry-pancake.svg",
    keywords: ["pancake", "waffle", "berry", "strawberry", "brunch"],
  },
  {
    imageUrl: "/food/chocolate-brownie.svg",
    keywords: ["brownie", "cookie", "chocolate", "sundae", "fudge"],
  },
  {
    imageUrl: "/food/cheesecake-shake.svg",
    keywords: ["cheesecake", "shake", "milkshake", "cream", "dessert", "lotus"],
  },
  {
    imageUrl: "/food/loaded-burger.svg",
    keywords: ["burger", "fries", "beef", "chicken burger", "loaded"],
  },
  {
    imageUrl: "/food/pasta-bake.svg",
    keywords: ["pasta", "lasagne", "gnocchi", "parmesan", "bake"],
  },
  {
    imageUrl: "/food/deli-sandwich.svg",
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
