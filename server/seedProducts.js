import Product from './models/product.model.js'

const products = [
  { 
    name: 'Mechanical Keyboard', 
    description: 'Compact wireless keyboard with custom tactile mechanical switches and matte PBT keycaps.', 
    price: 2999, 
    category: 'Electronics', 
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80', 
    stock: 10 
  },
  { 
    name: 'Noise Cancelling Headphones', 
    description: 'Acoustically tuned studio headphones with active ANC and memory foam earcups.', 
    price: 4999, 
    category: 'Electronics', 
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80', 
    stock: 12 
  },
  { 
    name: 'Everyday Backpack', 
    description: 'Weatherproof cordura backpack with magnetic latch and 16-inch padded laptop sleeve.', 
    price: 1899, 
    category: 'Fashion', 
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80', 
    stock: 8 
  },
  { 
    name: 'Ceramic Coffee Set', 
    description: 'Artisanal stoneware brew dripper with matching double-walled thermal cups.', 
    price: 1299, 
    category: 'Home', 
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80', 
    stock: 15 
  },
  { 
    name: 'Minimalist Desk Lamp', 
    description: 'Counterbalanced aluminum arm lamp with 3000K warm LED spotlight and brass dimmer.', 
    price: 2499, 
    category: 'Home', 
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80', 
    stock: 14 
  },
  { 
    name: 'Ergonomic Vertical Mouse', 
    description: 'Precision wireless laser mouse with 57-degree natural handshake posture angle.', 
    price: 1799, 
    category: 'Electronics', 
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=900&q=80', 
    stock: 20 
  },
  { 
    name: 'Walnut Monitor Riser', 
    description: 'Solid FSC-certified American walnut stand with integrated cable routing channels.', 
    price: 3199, 
    category: 'Home', 
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=900&q=80', 
    stock: 6 
  },
  { 
    name: 'Full-Grain Leather Wallet', 
    description: 'Hand-stitched vegetable tanned leather cardholder with RFID protection foil.', 
    price: 999, 
    category: 'Fashion', 
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80', 
    stock: 25 
  },
  { 
    name: 'Studio Desk Mat', 
    description: 'Heavyweight felt and vegan leather reversible surface for mechanical keyboards.', 
    price: 899, 
    category: 'Home', 
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=80', 
    stock: 30 
  },
  { 
    name: 'Titanium Chrono Watch', 
    description: 'Sapphire crystal timepiece with grade-5 sandblasted titanium bezel and Milanese strap.', 
    price: 8499, 
    category: 'Fashion', 
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80', 
    stock: 5 
  },
  { 
    name: 'Matte Aluminum Water Flask', 
    description: 'Vacuum insulated 750ml stainless vessel keeping cold for 24h with tactile silicone grip.', 
    price: 749, 
    category: 'Fashion', 
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80', 
    stock: 18 
  },
  { 
    name: 'Hi-Fi Bookshelf Speakers', 
    description: 'Passive nearfield reference monitors with silk dome tweeters and rear bass ports.', 
    price: 6999, 
    category: 'Electronics', 
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=900&q=80', 
    stock: 7 
  }
]

export const seedProducts = async () => {
  const count = await Product.countDocuments()
  if (count < 12) {
    await Product.deleteMany({})
    await Product.insertMany(products)
    console.log(`Catalog re-seeded: ${products.length} products loaded into MongoDB.`)
  }
}
