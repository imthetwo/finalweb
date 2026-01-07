import mongoose from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const vnPhoneRegex = /^(\+84|0)(3|5|7|8|9)\d{8}$/;

const userSchemas = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
			minlength: 6,
			maxlength: 30,
		},

		// hashed password stored; use virtual 'password' to set it
		hashedPassword: {
			type: String,
			required: true,
		},

		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			match: emailRegex,
		},

		displayName: {
			type: String,
			required: true,
			trim: true,
		},

		// avatar stored as an object (url + publicId). url has a default placeholder.
		avatar: {
			url: {
				type: String,
				default:
					"https://res.cloudinary.com/your-cloud-name/image/upload/v1/default_avatar.png",
			},
			publicId: String,
		},

		bio: {
			type: String,
			maxlength: 500,
		},

		phone: {
			type: String,
			match: vnPhoneRegex,
			sparse: true, // allow multiple nulls
		},

		role: {
			type: String,
			enum: ["admin", "staff", "customer"],
			default: "customer",
		},

		address: {
			city: { type: String },
			district: { type: String },
			street: { type: String },
		},
	},
	{
		timestamps: true,
	}
);
const User = mongoose.model("User", userSchemas);
export default User;









