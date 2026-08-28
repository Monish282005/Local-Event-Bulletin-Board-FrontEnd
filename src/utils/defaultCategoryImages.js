export const DEFAULT_CATEGORY_IMAGES = {
  sports: 'https://res.cloudinary.com/evrmjfy2/image/upload/v1787907059/Sport.jpg',
  music: 'https://res.cloudinary.com/evrmjfy2/image/upload/v1787906417/Music.jpg',
  food: 'https://res.cloudinary.com/evrmjfy2/image/upload/v1787906475/Food.jpg',
  yard_sale: 'https://res.cloudinary.com/evrmjfy2/image/upload/v1787906982/Yard.jpg',
  other: 'https://res.cloudinary.com/evrmjfy2/image/upload/v1787906587/Other.jpg',
};

export function getCategoryDefaultImage(category) {
  const cat = (category || '').toLowerCase().trim();
  if (cat === 'sports' || cat === 'sport') return DEFAULT_CATEGORY_IMAGES.sports;
  if (cat === 'music') return DEFAULT_CATEGORY_IMAGES.music;
  if (cat === 'food' || cat === 'food & drink') return DEFAULT_CATEGORY_IMAGES.food;
  if (cat === 'yard_sale' || cat === 'yard' || cat === 'yard sale') return DEFAULT_CATEGORY_IMAGES.yard_sale;
  return DEFAULT_CATEGORY_IMAGES.other;
}
