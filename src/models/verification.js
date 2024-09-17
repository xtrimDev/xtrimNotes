const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const verificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    uniqueString: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: {
        values: ['auth', 'reset'],
        message: '{VALUE} is not a valid type'
      },
      default: "auth",
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

/* Automatically delete expired documents */
verificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/* Hash uniqueString before saving to the database */
verificationSchema.pre("save", async function (next) {
  if (this.isModified("uniqueString") || this.isNew) {
    const salt = await bcrypt.genSalt(10);
    this.uniqueString = await bcrypt.hash(this.uniqueString, salt);
  }
  next();
});

module.exports = mongoose.model("Meta Users", verificationSchema);