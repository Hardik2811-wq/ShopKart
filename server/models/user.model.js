import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    wishlist: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], default: [] },
    cart: {
      type: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, default: 1, min: 1 },
      }],
      default: [],
    },
  },
  { timestamps: true },
)

export default mongoose.model('User', userSchema)
