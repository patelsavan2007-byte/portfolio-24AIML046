import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const taskUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address."],
    },
    password: {
      type: String,
      // Required for local auth, null for Google OAuth
      select: false, // Don't include password in query results by default
    },
    googleId: {
      type: String,
      // Unique for Google accounts, null for local auth
      unique: true,
      sparse: true, // Allow null values while maintaining uniqueness
    },
    firstName: {
      type: String,
      default: "",
      trim: true,
    },
    lastName: {
      type: String,
      default: "",
      trim: true,
    },
    avatar: {
      type: String,
      default: null, // URL from Google profile
    },
    authMethod: {
      type: String,
      enum: ["local", "google"],
      required: true,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// Hash password before saving (only for local auth)
taskUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
taskUserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// JSON transformation
taskUserSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.password; // Never expose password
  },
});

export const TaskUser = mongoose.model("TaskUser", taskUserSchema);

// Validation function for register
export function validateRegisterBody(body) {
  const errors = [];

  if (!body.email || body.email.trim() === "") {
    errors.push("Email is required.");
  } else if (!/^\S+@\S+\.\S+$/.test(body.email)) {
    errors.push("Email must be valid.");
  }

  if (!body.password || body.password === "") {
    errors.push("Password is required.");
  } else if (body.password.length < 6) {
    errors.push("Password must be at least 6 characters.");
  }

  return errors;
}

// Validation function for login
export function validateLoginBody(body) {
  const errors = [];

  if (!body.email || body.email.trim() === "") {
    errors.push("Email is required.");
  }

  if (!body.password || body.password === "") {
    errors.push("Password is required.");
  }

  return errors;
}
