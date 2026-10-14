import Product from '../models/product.model.js'

export const getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query
    const query = {}
    if (search) query.name = { $regex: search, $options: 'i' }
    if (category) query.category = category

    let sortOption = { createdAt: -1 }
    if (sort === 'price_asc') sortOption = { price: 1 }
    if (sort === 'price_desc') sortOption = { price: -1 }

    const products = await Product.find(query).sort(sortOption)
    return res.json({ success: true, products })
  } catch {
    return res.status(500).json({ success: false, message: 'Could not load products' })
  }
}

export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })
    return res.json({ success: true, product })
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid product ID' })
  }
}
