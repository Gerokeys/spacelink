// Seed data for amenities — run once via prisma seed script

export const AMENITIES_SEED = [
  // Basics
  { name: "WiFi", icon: "wifi", category: "Basics" },
  { name: "Air Conditioning", icon: "wind", category: "Basics" },
  { name: "Heating", icon: "thermometer", category: "Basics" },
  { name: "Furnished", icon: "sofa", category: "Basics" },
  { name: "Washing Machine", icon: "washing-machine", category: "Basics" },
  { name: "Dishwasher", icon: "utensils", category: "Basics" },

  // Security
  { name: "24hr Security", icon: "shield", category: "Security" },
  { name: "CCTV", icon: "camera", category: "Security" },
  { name: "Electric Fence", icon: "zap", category: "Security" },
  { name: "Gated Community", icon: "gate", category: "Security" },
  { name: "Intercom", icon: "phone", category: "Security" },
  { name: "Panic Button", icon: "alert-circle", category: "Security" },

  // Amenities
  { name: "Swimming Pool", icon: "waves", category: "Amenities" },
  { name: "Gym", icon: "dumbbell", category: "Amenities" },
  { name: "Rooftop Terrace", icon: "sun", category: "Amenities" },
  { name: "Garden", icon: "tree-pine", category: "Amenities" },
  { name: "Balcony", icon: "layout", category: "Amenities" },
  { name: "Children Play Area", icon: "playground", category: "Amenities" },

  // Parking
  { name: "Parking", icon: "car", category: "Parking" },
  { name: "Covered Parking", icon: "warehouse", category: "Parking" },
  { name: "Visitor Parking", icon: "car", category: "Parking" },

  // Utilities
  { name: "Water 24hr", icon: "droplets", category: "Utilities" },
  { name: "Borehole", icon: "droplet", category: "Utilities" },
  { name: "Backup Generator", icon: "zap", category: "Utilities" },
  { name: "Solar Power", icon: "sun", category: "Utilities" },
  { name: "DSTV Ready", icon: "tv", category: "Utilities" },
  { name: "Fibre Ready", icon: "cable", category: "Utilities" },

  // Pet & Lifestyle
  { name: "Pet Friendly", icon: "paw-print", category: "Lifestyle" },
  { name: "Servant Quarters", icon: "home", category: "Lifestyle" },
  { name: "Lift/Elevator", icon: "arrow-up-down", category: "Lifestyle" },

  // Office-specific
  { name: "Conference Room", icon: "presentation", category: "Office" },
  { name: "Reception Area", icon: "building", category: "Office" },
  { name: "Server Room", icon: "server", category: "Office" },
  { name: "Open Plan", icon: "layout-grid", category: "Office" },
  { name: "Private Offices", icon: "door-closed", category: "Office" },
  { name: "Kitchen/Pantry", icon: "coffee", category: "Office" },
]
