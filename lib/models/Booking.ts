import mongoose, { Schema, Document, Model, models } from 'mongoose'
import './User' // register User schema so .populate('createdBy') can resolve it

/**
 * Booking model — represents a completed hotel check-in.
 *
 * Each booking has:
 *  - One or more guests (first = primary contact)
 *  - One or more rooms
 *  - Optional photos per guest and a single group ID proof document
 *    (both stored in Google Drive, referenced by fileId + public URL)
 *  - Status lifecycle: checked_in → checked_out | cancelled
 */

export interface IGuest {
  name: string
  phone?: string
  age?: number
  sex?: 'male' | 'female' | 'other'
  photoFileId?: string
  photoUrl?: string
  isPrimary: boolean
}

export interface IBooking extends Document {
  hotelId: mongoose.Types.ObjectId
  bookingReference: string        // e.g. "SS1A2B3C" — unique, human-readable
  checkInTime: Date
  checkOutDate: Date
  status: 'checked_in' | 'checked_out' | 'cancelled'
  roomIds: mongoose.Types.ObjectId[]
  guests: IGuest[]
  idProofFileId?: string
  idProofUrl?: string
  notes?: string
  nights: number
  /** Custom per-night charge set at check-in time. Overrides room's pricePerNight. */
  customChargePerNight?: number
  address?: string
  nationality: string
  totalGuests: number
  maleGuestsCount: number
  femaleGuestsCount: number
  childGuestsCount: number
  purposeOfTravel?: string
  paymentMode: 'cash' | 'online'
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
}

const GuestSchema = new Schema<IGuest>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    age: { type: Number, min: 0, max: 150 },
    sex: { type: String, enum: ['male', 'female', 'other'] },
    photoFileId: { type: String },
    photoUrl: { type: String },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }  // guests are sub-documents, no separate _id needed
)

const BookingSchema = new Schema<IBooking>(
  {
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    bookingReference: { type: String, required: true, unique: true, uppercase: true, trim: true },
    checkInTime: { type: Date, default: Date.now },
    checkOutDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['checked_in', 'checked_out', 'cancelled'],
      default: 'checked_in',
      required: true,
    },
    roomIds: [{ type: Schema.Types.ObjectId, ref: 'Room' }],
    guests: { type: [GuestSchema], required: true, validate: [(v: IGuest[]) => v.length > 0, 'At least one guest required'] },
    idProofFileId: { type: String },
    idProofUrl: { type: String },
    notes: { type: String, trim: true },
    nights: { type: Number, required: true, min: 1 },
    customChargePerNight: { type: Number, min: 0 },
    address: { type: String, trim: true },
    nationality: { type: String, required: true, trim: true, default: 'India' },
    totalGuests: { type: Number, required: true, min: 1, default: 1 },
    maleGuestsCount: { type: Number, required: true, min: 0, default: 0 },
    femaleGuestsCount: { type: Number, required: true, min: 0, default: 0 },
    childGuestsCount: { type: Number, required: true, min: 0, default: 0 },
    purposeOfTravel: { type: String, trim: true },
    paymentMode: { type: String, enum: ['cash', 'online'], required: true, default: 'cash' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
)

// Index for common queries: hotel bookings sorted by check-in time
BookingSchema.index({ hotelId: 1, checkInTime: -1 })
// Index for status filtering
BookingSchema.index({ hotelId: 1, status: 1 })

const Booking: Model<IBooking> = models.Booking ?? mongoose.model<IBooking>('Booking', BookingSchema)
export default Booking
