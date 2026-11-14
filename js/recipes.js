/**
 * recipes.js
 * Engine Rekomendasi Menu Masakan Cerdas Berdasarkan Isi Keranjang Belanja
 */

export const RECIPE_DATABASE = [
  {
    id: 'nasi-goreng-spesial',
    name: 'Nasi Goreng Spesial',
    emoji: '🍳',
    category: 'Makanan Utama',
    prepTime: '10 menit',
    cookTime: '15 menit',
    servings: '2 porsi',
    keywords: ['beras', 'nasi', 'telur', 'bawang', 'minyak', 'cabai', 'kecap'],
    requiredIngredients: [
      { name: 'Nasi / Beras', keyword: 'beras' },
      { name: 'Telur Ayam', keyword: 'telur' },
      { name: 'Bawang Merah / Putih', keyword: 'bawang' },
      { name: 'Minyak Goreng', keyword: 'minyak' }
    ],
    optionalIngredients: [
      { name: 'Kecap Manis', keyword: 'kecap' },
      { name: 'Cabai / Sambal', keyword: 'cabai' },
      { name: 'Sosis / Bakso', keyword: 'sosis' }
    ],
    instructions: [
      'Panaskan 2 sdm minyak di wajan.',
      'Tumis irisan bawang hingga harum keemasan.',
      'Masukkan telur, buat orak-arik setengah matang.',
      'Masukkan nasi dingin, aduk rata dengan api sedang.',
      'Tambahkan kecap manis, garam, dan lada secukupnya. Aduk hingga matang merata.'
    ]
  },
  {
    id: 'telur-dadar-padang',
    name: 'Telur Dadar Tebal Crispy',
    emoji: '🥚',
    category: 'Lauk Pauk',
    prepTime: '5 menit',
    cookTime: '10 menit',
    servings: '2-3 porsi',
    keywords: ['telur', 'bawang', 'minyak', 'cabai', 'tepung'],
    requiredIngredients: [
      { name: 'Telur Ayam', keyword: 'telur' },
      { name: 'Bawang Merah / Daun Bawang', keyword: 'bawang' },
      { name: 'Minyak Goreng', keyword: 'minyak' }
    ],
    optionalIngredients: [
      { name: 'Cabai Merah', keyword: 'cabai' },
      { name: 'Tepung Terigu / Beras', keyword: 'tepung' }
    ],
    instructions: [
      'Kocok 3-4 butir telur bersama irisan bawang dan cabai.',
      'Tambahkan 1 sdm tepung beras/terigu dan garam secukupnya agar tebal.',
      'Panaskan minyak cukup banyak di wajan.',
      'Tuang adonan telur, goreng hingga kecokelatan dan renyah di kedua sisi.'
    ]
  },
  {
    id: 'sayur-sop-segar',
    name: 'Sayur Sop Sehat Gurih',
    emoji: '🍲',
    category: 'Sup & Sayuran',
    prepTime: '15 menit',
    cookTime: '20 menit',
    servings: '3-4 porsi',
    keywords: ['sayur', 'wortel', 'kentang', 'bawang', 'ayam', 'bakso', 'sosis'],
    requiredIngredients: [
      { name: 'Wortel / Kentang / Kol', keyword: 'sayur' },
      { name: 'Bawang Putih & Merah', keyword: 'bawang' }
    ],
    optionalIngredients: [
      { name: 'Daging Ayam / Sapi', keyword: 'ayam' },
      { name: 'Bakso / Sosis', keyword: 'bakso' },
      { name: 'Daun Seledri', keyword: 'seledri' }
    ],
    instructions: [
      'Rebus air hingga mendidih (bisa masukkan potongan ayam untuk kaldu).',
      'Tumis bawang putih cincang hingga harum, masukkan ke dalam air rebusan.',
      'Masukkan wortel dan kentang terlebih dahulu hingga setengah empuk.',
      'Tambahkan kol, buncis, bakso, garam, dan kaldu bubuk.',
      'Masak 5 menit hingga matang lalu taburi bawang goreng.'
    ]
  },
  {
    id: 'tumis-kangkung-terasi',
    name: 'Tumis Kangkung / Sayur Bening',
    emoji: '🥬',
    category: 'Sayuran Sehat',
    prepTime: '5 menit',
    cookTime: '7 menit',
    servings: '2 porsi',
    keywords: ['kangkung', 'sayur', 'bawang', 'cabai', 'minyak', 'tomat'],
    requiredIngredients: [
      { name: 'Kangkung / Sayuran Hijau', keyword: 'kangkung' },
      { name: 'Bawang Merah & Putih', keyword: 'bawang' },
      { name: 'Minyak Goreng', keyword: 'minyak' }
    ],
    optionalIngredients: [
      { name: 'Cabai Rawit', keyword: 'cabai' },
      { name: 'Tomat Segar', keyword: 'tomat' },
      { name: 'Terasi / Saus Tiram', keyword: 'saus' }
    ],
    instructions: [
      'Petik dan cuci bersih kangkung.',
      'Panaskan sedikit minyak, tumis irisan bawang dan cabai hingga layu.',
      'Masukkan kangkung, tumis dengan api besar agar warna tetap hijau segar.',
      'Beri sedikit garam, gula, dan saus tiram. Masak cepat sekitar 2-3 menit.'
    ]
  },
  {
    id: 'ayam-goreng-lengkuas',
    name: 'Ayam Goreng Gurih Krispi',
    emoji: '🍗',
    category: 'Lauk Utama',
    prepTime: '15 menit',
    cookTime: '25 menit',
    servings: '4 porsi',
    keywords: ['ayam', 'bawang', 'minyak', 'bumbu', 'kunyit'],
    requiredIngredients: [
      { name: 'Daging Ayam Segar', keyword: 'ayam' },
      { name: 'Bawang Putih', keyword: 'bawang' },
      { name: 'Minyak Goreng', keyword: 'minyak' }
    ],
    optionalIngredients: [
      { name: 'Kunyit / Bumbu Racik', keyword: 'bumbu' },
      { name: 'Lengkuas / Jahe', keyword: 'lengkuas' }
    ],
    instructions: [
      'Ungkep ayam bersama bumbu halus (bawang putih, kunyit, ketumbar, garam) hingga empuk.',
      'Tiriskan ayam dari air ungkepan.',
      'Panaskan minyak panas, goreng ayam hingga kuning kecokelatan keemasan.',
      'Sajikan hangat dengan nasi dan sambal.'
    ]
  },
  {
    id: 'mie-goreng-spesial',
    name: 'Mie Goreng Spesial Komplit',
    emoji: '🍜',
    category: 'Makanan Cepat Saji',
    prepTime: '5 menit',
    cookTime: '10 menit',
    servings: '1-2 porsi',
    keywords: ['mie', 'telur', 'sayur', 'bawang', 'minyak', 'cabai'],
    requiredIngredients: [
      { name: 'Mie Instan / Mie Telur', keyword: 'mie' },
      { name: 'Telur Ayam', keyword: 'telur' },
      { name: 'Minyak Goreng', keyword: 'minyak' }
    ],
    optionalIngredients: [
      { name: 'Sawi / Kol / Sayur', keyword: 'sayur' },
      { name: 'Bawang Merah / Putih', keyword: 'bawang' },
      { name: 'Cabai Rawit', keyword: 'cabai' }
    ],
    instructions: [
      'Rebus mie hingga setengah matang, tiriskan dan lumuri sedikit minyak/kecap.',
      'Tumis irisan bawang dan cabai di wajan.',
      'Masukkan telur, buat orak-arik.',
      'Masukkan sayuran dan mie, aduk merata bersama bumbu mie.',
      'Masak hingga bumbu meresap dan mie matang sempurna.'
    ]
  },
  {
    id: 'tahu-tempe-bacem-goreng',
    name: 'Tahu & Tempe Goreng Bumbu Gurih',
    emoji: '🥢',
    category: 'Lauk Hemat',
    prepTime: '10 menit',
    cookTime: '15 menit',
    servings: '3-4 porsi',
    keywords: ['tahu', 'tempe', 'bawang', 'minyak', 'bumbu'],
    requiredIngredients: [
      { name: 'Tahu / Tempe', keyword: 'tahu' },
      { name: 'Minyak Goreng', keyword: 'minyak' }
    ],
    optionalIngredients: [
      { name: 'Bawang Putih & Ketumbar', keyword: 'bawang' },
      { name: 'Garam & Kaldu', keyword: 'garam' }
    ],
    instructions: [
      'Potong tahu dan tempe sesuai selera.',
      'Rendam sebentar dalam air bumbu bawang putih dan garam.',
      'Goreng dalam minyak panas hingga berkulit renyah dan matang kecokelatan.',
      'Angkat dan tiriskan.'
    ]
  },
  {
    id: 'capcay-kuah-kental',
    name: 'Capcay Sayur Komplit',
    emoji: '🥦',
    category: 'Sayuran & Protein',
    prepTime: '10 menit',
    cookTime: '15 menit',
    servings: '3 porsi',
    keywords: ['sayur', 'wortel', 'kol', 'ayam', 'bakso', 'bawang', 'minyak', 'telur'],
    requiredIngredients: [
      { name: 'Aneka Sayuran (Wortel, Kol, Brokoli)', keyword: 'sayur' },
      { name: 'Bawang Putih', keyword: 'bawang' },
      { name: 'Minyak Goreng', keyword: 'minyak' }
    ],
    optionalIngredients: [
      { name: 'Daging Ayam / Telur', keyword: 'ayam' },
      { name: 'Bakso / Sosis', keyword: 'bakso' },
      { name: 'Saus Tiram', keyword: 'saus' }
    ],
    instructions: [
      'Tumis bawang putih cincang hingga harum.',
      'Masukkan ayam/bakso/telur, masak hingga berubah warna.',
      'Masukkan sayuran yang keras terlebih dahulu (wortel), disusul sayuran hijau.',
      'Beri air sedikit, saus tiram, garam, dan lada.',
      'Kentalkan dengan larutan maizena/tepung jika suka kuah kental.'
    ]
  },
  {
    id: 'sambal-tomat-terasi',
    name: 'Sambal Tomat Terasi Pedas Nikmat',
    emoji: '🌶️',
    category: 'Sambal & Pelengkap',
    prepTime: '5 menit',
    cookTime: '10 menit',
    servings: '4 porsi',
    keywords: ['cabai', 'tomat', 'bawang', 'minyak', 'terasi'],
    requiredIngredients: [
      { name: 'Cabai Rawit / Merah', keyword: 'cabai' },
      { name: 'Tomat Merah', keyword: 'tomat' },
      { name: 'Bawang Merah & Putih', keyword: 'bawang' },
      { name: 'Minyak Goreng', keyword: 'minyak' }
    ],
    optionalIngredients: [
      { name: 'Terasi', keyword: 'terasi' },
      { name: 'Gula Merah / Pasir', keyword: 'gula' }
    ],
    instructions: [
      'Goreng cabai, tomat, dan bawang dengan sedikit minyak hingga layu.',
      'Ulek kasar bersama garam, gula, dan terasi bakar.',
      'Siram dengan sedikit minyak panas sisa menggoreng.',
      'Siap disantap bersama aneka lauk goreng.'
    ]
  }
];

export const RecipeEngine = {
  /**
   * Menganalisa kecocokan resep masakan berdasarkan daftar item di keranjang belanja
   * @param {Array} cartItems 
   * @returns {Array} Daftar resep terurut berdasarkan tingkat kecocokan tertinggi
   */
  matchRecipes(cartItems = []) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return RECIPE_DATABASE.map((recipe) => ({
        ...recipe,
        matchScore: 0,
        matchPercentage: 0,
        availableIngredients: [],
        missingIngredients: recipe.requiredIngredients.map((r) => r.name),
        canCookNow: false
      }));
    }

    // Normalisasi teks nama barang di troli
    const cartKeywords = cartItems.map((item) => (item.name || '').toLowerCase());

    return RECIPE_DATABASE.map((recipe) => {
      const availableRequired = [];
      const missingRequired = [];

      recipe.requiredIngredients.forEach((req) => {
        const found = cartKeywords.some((cartName) => {
          return cartName.includes(req.keyword) || req.keyword.includes(cartName);
        });

        if (found) {
          availableRequired.push(req.name);
        } else {
          missingRequired.push(req.name);
        }
      });

      const totalReq = recipe.requiredIngredients.length;
      const matchedReqCount = availableRequired.length;
      const matchPercentage = totalReq > 0 ? Math.round((matchedReqCount / totalReq) * 100) : 0;
      const canCookNow = matchPercentage >= 75;

      return {
        ...recipe,
        matchScore: matchedReqCount,
        matchPercentage,
        availableIngredients: availableRequired,
        missingIngredients: missingRequired,
        canCookNow
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }
};
