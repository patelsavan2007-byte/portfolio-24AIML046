import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required."],
      trim: true,
      minlength: [1, "Title cannot be empty."],
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

taskSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id?.toString();
    delete ret._id;
  },
});

export const Task = mongoose.model("Task", taskSchema);

export function validateTaskBody(body, isUpdate = false) {
  const errors = [];

  if (!isUpdate || body.title !== undefined) {
    if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
      errors.push("'title' is required and must be a non-empty string.");
    }
  }

  if (body.completed !== undefined && typeof body.completed !== "boolean") {
    errors.push("'completed' must be a boolean.");
  }

  if (body.status !== undefined) {
    const validStatuses = ["pending", "in-progress", "completed"];
    if (!validStatuses.includes(body.status)) {
      errors.push(`'status' must be one of: ${validStatuses.join(", ")}.`);
    }
  }

  if (body.priority !== undefined) {
    const validPriorities = ["low", "medium", "high"];
    if (!validPriorities.includes(body.priority)) {
      errors.push(`'priority' must be one of: ${validPriorities.join(", ")}.`);
    }
  }

  return errors;
}
