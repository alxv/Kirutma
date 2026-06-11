// Generated from Lucide icons (ISC). Preview + canvas insertion only.

import type { SymbolPathDef } from "@/lib/svg-path-import";

export type SymbolCategory = "icons" | "stamps" | "symbols" | "buildings" | "signs";

export interface LibrarySymbol {
  id: string;
  name: string;
  category: SymbolCategory;
  viewBox: number;
  paths: SymbolPathDef[];
  keywords: string[];
}

export const SYMBOL_CATEGORIES = [
  { id: "icons", label: "Icons" },
  { id: "stamps", label: "Stamps" },
  { id: "symbols", label: "Symbols" },
  { id: "buildings", label: "Buildings" },
  { id: "signs", label: "Signs" },
] as const;

export const SYMBOL_LIBRARY: LibrarySymbol[] = [
  {
    "id": "star",
    "name": "Star",
    "category": "icons",
    "keywords": [
      "favorite",
      "rating"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
        "closed": true
      }
    ]
  },
  {
    "id": "heart",
    "name": "Heart",
    "category": "icons",
    "keywords": [
      "love",
      "like"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
        "closed": true
      }
    ]
  },
  {
    "id": "search",
    "name": "Search",
    "category": "icons",
    "keywords": [
      "find",
      "magnifier"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "m21 21-4.34-4.34",
        "closed": false
      },
      {
        "d": "M 3 11 A 8 8 0 1 0 19 11 A 8 8 0 1 0 3 11 Z",
        "closed": true
      }
    ]
  },
  {
    "id": "mail",
    "name": "Mail",
    "category": "icons",
    "keywords": [
      "email",
      "envelope"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7",
        "closed": false
      }
    ]
  },
  {
    "id": "phone",
    "name": "Phone",
    "category": "icons",
    "keywords": [
      "call",
      "mobile"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
        "closed": false
      }
    ]
  },
  {
    "id": "camera",
    "name": "Camera",
    "category": "icons",
    "keywords": [
      "photo"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",
        "closed": true
      },
      {
        "d": "M 9 13 A 3 3 0 1 0 15 13 A 3 3 0 1 0 9 13 Z",
        "closed": true
      }
    ]
  },
  {
    "id": "bell",
    "name": "Bell",
    "category": "icons",
    "keywords": [
      "notification",
      "alert"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M10.268 21a2 2 0 0 0 3.464 0",
        "closed": false
      },
      {
        "d": "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
        "closed": false
      }
    ]
  },
  {
    "id": "settings",
    "name": "Settings",
    "category": "icons",
    "keywords": [
      "gear",
      "preferences"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
        "closed": true
      },
      {
        "d": "M 9 12 A 3 3 0 1 0 15 12 A 3 3 0 1 0 9 12 Z",
        "closed": true
      }
    ]
  },
  {
    "id": "user",
    "name": "User",
    "category": "icons",
    "keywords": [
      "person",
      "profile"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",
        "closed": false
      },
      {
        "d": "M 8 7 A 4 4 0 1 0 16 7 A 4 4 0 1 0 8 7 Z",
        "closed": true
      }
    ]
  },
  {
    "id": "bookmark",
    "name": "Bookmark",
    "category": "icons",
    "keywords": [
      "save"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z",
        "closed": true
      }
    ]
  },
  {
    "id": "stamp",
    "name": "Stamp",
    "category": "stamps",
    "keywords": [
      "approve",
      "seal"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M5 22h14",
        "closed": false
      },
      {
        "d": "M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-.66-.26-1.3-.73-1.77Z",
        "closed": true
      },
      {
        "d": "M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-3-3c-1.66 0-3 1-3 3s1 2 1 3.5V13",
        "closed": false
      }
    ]
  },
  {
    "id": "badge-check",
    "name": "Verified badge",
    "category": "stamps",
    "keywords": [
      "approved",
      "certified"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",
        "closed": true
      },
      {
        "d": "m9 12 2 2 4-4",
        "closed": false
      }
    ]
  },
  {
    "id": "award",
    "name": "Award",
    "category": "stamps",
    "keywords": [
      "medal",
      "prize"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",
        "closed": false
      },
      {
        "d": "M 6 8 A 6 6 0 1 0 18 8 A 6 6 0 1 0 6 8 Z",
        "closed": true
      }
    ]
  },
  {
    "id": "target",
    "name": "Target",
    "category": "stamps",
    "keywords": [
      "bullseye",
      "goal"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M 2 12 A 10 10 0 1 0 22 12 A 10 10 0 1 0 2 12 Z",
        "closed": true
      },
      {
        "d": "M 6 12 A 6 6 0 1 0 18 12 A 6 6 0 1 0 6 12 Z",
        "closed": true
      },
      {
        "d": "M 10 12 A 2 2 0 1 0 14 12 A 2 2 0 1 0 10 12 Z",
        "closed": true
      }
    ]
  },
  {
    "id": "info",
    "name": "Info",
    "category": "symbols",
    "keywords": [
      "information"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M12 16v-4",
        "closed": false
      },
      {
        "d": "M12 8h.01",
        "closed": false
      },
      {
        "d": "M 2 12 A 10 10 0 1 0 22 12 A 10 10 0 1 0 2 12 Z",
        "closed": true
      }
    ]
  },
  {
    "id": "triangle-alert",
    "name": "Warning",
    "category": "symbols",
    "keywords": [
      "alert",
      "caution"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
        "closed": false
      },
      {
        "d": "M12 9v4",
        "closed": false
      },
      {
        "d": "M12 17h.01",
        "closed": false
      }
    ]
  },
  {
    "id": "circle-alert",
    "name": "Alert",
    "category": "symbols",
    "keywords": [
      "error",
      "important"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M 2 12 A 10 10 0 1 0 22 12 A 10 10 0 1 0 2 12 Z",
        "closed": true
      }
    ]
  },
  {
    "id": "plus",
    "name": "Plus",
    "category": "symbols",
    "keywords": [
      "add"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M5 12h14",
        "closed": false
      },
      {
        "d": "M12 5v14",
        "closed": false
      }
    ]
  },
  {
    "id": "minus",
    "name": "Minus",
    "category": "symbols",
    "keywords": [
      "subtract"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M5 12h14",
        "closed": false
      }
    ]
  },
  {
    "id": "check",
    "name": "Check",
    "category": "symbols",
    "keywords": [
      "done",
      "tick"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M20 6 9 17l-5-5",
        "closed": false
      }
    ]
  },
  {
    "id": "x",
    "name": "Close",
    "category": "symbols",
    "keywords": [
      "cancel",
      "remove"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M18 6 6 18",
        "closed": false
      },
      {
        "d": "m6 6 12 12",
        "closed": false
      }
    ]
  },
  {
    "id": "zap",
    "name": "Zap",
    "category": "symbols",
    "keywords": [
      "bolt",
      "energy"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
        "closed": true
      }
    ]
  },
  {
    "id": "house",
    "name": "House",
    "category": "buildings",
    "keywords": [
      "home",
      "residence"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",
        "closed": false
      },
      {
        "d": "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
        "closed": true
      }
    ]
  },
  {
    "id": "building-2",
    "name": "Office building",
    "category": "buildings",
    "keywords": [
      "tower",
      "city"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z",
        "closed": true
      },
      {
        "d": "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2",
        "closed": false
      },
      {
        "d": "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2",
        "closed": false
      },
      {
        "d": "M10 6h4",
        "closed": false
      },
      {
        "d": "M10 10h4",
        "closed": false
      },
      {
        "d": "M10 14h4",
        "closed": false
      },
      {
        "d": "M10 18h4",
        "closed": false
      }
    ]
  },
  {
    "id": "warehouse",
    "name": "Warehouse",
    "category": "buildings",
    "keywords": [
      "storage",
      "industrial"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M18 21V10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11",
        "closed": false
      },
      {
        "d": "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8z",
        "closed": true
      },
      {
        "d": "M6 13h12",
        "closed": false
      },
      {
        "d": "M6 17h12",
        "closed": false
      }
    ]
  },
  {
    "id": "factory",
    "name": "Factory",
    "category": "buildings",
    "keywords": [
      "plant",
      "industrial"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M12 16h.01",
        "closed": false
      },
      {
        "d": "M16 16h.01",
        "closed": false
      },
      {
        "d": "M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 10.5v-2a.5.5 0 0 0-.769-.422L9.77 10.922A.5.5 0 0 1 9 10.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z",
        "closed": true
      },
      {
        "d": "M8 16h.01",
        "closed": false
      }
    ]
  },
  {
    "id": "hospital",
    "name": "Hospital",
    "category": "buildings",
    "keywords": [
      "medical",
      "health"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M12 6v4",
        "closed": false
      },
      {
        "d": "M14 14h-4",
        "closed": false
      },
      {
        "d": "M14 18h-4",
        "closed": false
      },
      {
        "d": "M14 8h-4",
        "closed": false
      },
      {
        "d": "M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2",
        "closed": false
      },
      {
        "d": "M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18",
        "closed": false
      }
    ]
  },
  {
    "id": "school",
    "name": "School",
    "category": "buildings",
    "keywords": [
      "education",
      "university"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M14 22v-4a2 2 0 1 0-4 0v4",
        "closed": false
      },
      {
        "d": "m18 10 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.382a1 1 0 0 1 .553-.894L6 10",
        "closed": false
      },
      {
        "d": "M18 5v17",
        "closed": false
      },
      {
        "d": "m4 6 7.106-3.553a2 2 0 0 1 1.788 0L20 6",
        "closed": false
      },
      {
        "d": "M6 5v17",
        "closed": false
      },
      {
        "d": "M 10 9 A 2 2 0 1 0 14 9 A 2 2 0 1 0 10 9 Z",
        "closed": true
      }
    ]
  },
  {
    "id": "store",
    "name": "Store",
    "category": "buildings",
    "keywords": [
      "shop",
      "retail"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7",
        "closed": false
      },
      {
        "d": "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8",
        "closed": false
      },
      {
        "d": "M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4",
        "closed": false
      },
      {
        "d": "M2 7h20",
        "closed": false
      },
      {
        "d": "M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7",
        "closed": false
      }
    ]
  },
  {
    "id": "hotel",
    "name": "Hotel",
    "category": "buildings",
    "keywords": [
      "lodging",
      "stay"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M10 22v-6.57",
        "closed": false
      },
      {
        "d": "M12 11h.01",
        "closed": false
      },
      {
        "d": "M12 7h.01",
        "closed": false
      },
      {
        "d": "M14 15.43V22",
        "closed": false
      },
      {
        "d": "M15 16a5 5 0 0 0-6 0",
        "closed": false
      },
      {
        "d": "M16 11h.01",
        "closed": false
      },
      {
        "d": "M16 7h.01",
        "closed": false
      },
      {
        "d": "M8 11h.01",
        "closed": false
      },
      {
        "d": "M8 7h.01",
        "closed": false
      }
    ]
  },
  {
    "id": "signpost",
    "name": "Signpost",
    "category": "signs",
    "keywords": [
      "direction",
      "road"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M12 13v8",
        "closed": false
      },
      {
        "d": "M12 3v3",
        "closed": false
      },
      {
        "d": "M18 6a2 2 0 0 1 1.387.56l2.307 2.22a1 1 0 0 1 0 1.44l-2.307 2.22A2 2 0 0 1 18 13H6a2 2 0 0 1-1.387-.56l-2.306-2.22a1 1 0 0 1 0-1.44l2.306-2.22A2 2 0 0 1 6 6z",
        "closed": true
      }
    ]
  },
  {
    "id": "map-pin",
    "name": "Map pin",
    "category": "signs",
    "keywords": [
      "location",
      "marker"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
        "closed": false
      },
      {
        "d": "M 9 10 A 3 3 0 1 0 15 10 A 3 3 0 1 0 9 10 Z",
        "closed": true
      }
    ]
  },
  {
    "id": "traffic-cone",
    "name": "Traffic cone",
    "category": "signs",
    "keywords": [
      "construction",
      "roadwork"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M16.05 10.966a5 2.5 0 0 1-8.1 0",
        "closed": false
      },
      {
        "d": "m16.923 14.049 4.48 2.04a1 1 0 0 1 .001 1.831l-8.574 3.9a2 2 0 0 1-1.66 0l-8.574-3.91a1 1 0 0 1 0-1.83l4.484-2.04",
        "closed": false
      },
      {
        "d": "M16.949 14.14a5 2.5 0 1 1-9.9 0L10.063 3.5a2 2 0 0 1 3.874 0z",
        "closed": true
      },
      {
        "d": "M9.194 6.57a5 2.5 0 0 0 5.61 0",
        "closed": false
      }
    ]
  },
  {
    "id": "octagon",
    "name": "Stop sign",
    "category": "signs",
    "keywords": [
      "stop",
      "halt"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z",
        "closed": true
      }
    ]
  },
  {
    "id": "parking-circle",
    "name": "Parking",
    "category": "signs",
    "keywords": [
      "car",
      "park"
    ],
    "viewBox": 24,
    "paths": []
  },
  {
    "id": "milestone",
    "name": "Milestone",
    "category": "signs",
    "keywords": [
      "distance",
      "marker"
    ],
    "viewBox": 24,
    "paths": [
      {
        "d": "M12 13v8",
        "closed": false
      },
      {
        "d": "M12 3v3",
        "closed": false
      },
      {
        "d": "M4 6a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h13a2 2 0 0 0 1.152-.365l3.424-2.317a1 1 0 0 0 0-1.635l-3.424-2.318A2 2 0 0 0 17 6z",
        "closed": true
      }
    ]
  },
  {
    "id": "navigation",
    "name": "Navigation",
    "category": "signs",
    "keywords": [
      "compass",
      "arrow"
    ],
    "viewBox": 24,
    "paths": []
  }
];

export const SYMBOL_BY_ID = Object.fromEntries(SYMBOL_LIBRARY.map((symbol) => [symbol.id, symbol])) as Record<string, LibrarySymbol>;

export function symbolsForCategory(category: SymbolCategory | "all"): LibrarySymbol[] {
  if (category === "all") return SYMBOL_LIBRARY;
  return SYMBOL_LIBRARY.filter((symbol) => symbol.category === category);
}

export function searchSymbols(query: string, category: SymbolCategory | "all"): LibrarySymbol[] {
  const normalized = query.trim().toLowerCase();
  const pool = symbolsForCategory(category);
  if (!normalized) return pool;
  return pool.filter(
    (symbol) =>
      symbol.name.toLowerCase().includes(normalized) ||
      symbol.keywords.some((keyword) => keyword.includes(normalized)),
  );
}
