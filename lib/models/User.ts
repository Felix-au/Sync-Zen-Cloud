import mongoose, { Schema, Document, Model, models } from 'mongoose'

/**
 * User model — covers all roles in the system.
 * super_admin: global access (Felix), no hotelId
 * hotel_owner: full control of their hotel
 * manager: same as owner except hotel deletion & managing managers
 * staff: check-in / check-out only
 */

export interface IUser extends Document {
  email: string
  username: string
  passwordHash: string
  name: string
  role: 'super_admin' | 'hotel_owner' | 'manager' | 'staff'
  hotelId: mongoose.Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['super_admin', 'hotel_owner', 'manager', 'staff'],
      default: 'staff',
      required: true,
    },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', default: null },
  },
  { timestamps: true }
)

// Prevent model recompilation during hot reloads
const User: Model<IUser> = models.User ?? mongoose.model<IUser>('User', UserSchema)
export default User
