
export interface ClothingItem {
  id: string; // Unique ID for React keys
  file?: File; // Optional: user uploaded files exist, presets do not
  previewUrl: string;
}

export interface Wardrobe {
  headwear: ClothingItem[];
  upperBody: ClothingItem[];
  lowerBody: ClothingItem[];
  footwear: ClothingItem[];
  accessories: ClothingItem[];
}

export interface AppState {
  profilePhoto: File | null;
  profilePreviewUrl: string | null;
  wardrobe: Wardrobe;
}

// The structure for our dynamic resource library
export interface AssetLibrary {
  profile: string[];
  upperBody: string[];
  lowerBody: string[];
  footwear: string[];
  headwear: string[];
  accessories: string[];
}

export const INITIAL_WARDROBE: Wardrobe = {
  headwear: [],
  upperBody: [],
  lowerBody: [],
  footwear: [],
  accessories: [],
};
