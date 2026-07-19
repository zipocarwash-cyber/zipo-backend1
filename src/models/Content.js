const mongoose = require('mongoose');

// This whole site only ever needs ONE content document — it holds
// everything the "Edit Site" admin panel can change: tagline, plan
// name/desc/price overrides, add-ons list, social links, gallery photo.
const PlanSchema = new mongoose.Schema(
  {
    name: String,
    desc: String,
    price: String
  },
  { _id: false }
);

const AddonSchema = new mongoose.Schema(
  {
    name: String,
    price: mongoose.Schema.Types.Mixed // stored as string or number, frontend parses it
  },
  { _id: false }
);

const ContentSchema = new mongoose.Schema(
  {
    tagline: { type: String, default: '' },
    plans: { type: [PlanSchema], default: [] },
    addons: { type: [AddonSchema], default: [] },
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' }
    },
    // Stored as a data: URL (base64) since that's what the frontend sends.
    // Fine for a single showcase photo; for heavier media, swap this for
    // an object-storage URL (S3 / Cloudinary / etc).
    galleryImage: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Content', ContentSchema);
