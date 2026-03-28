import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, "full name is required"],
    },
    email: {
        type: String,
        required: [true, "email is required"],
        unique: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, " email is invalid"],
    },
    password: {
        type: String,
        required: [true, "password is required"],
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    }
}, {
    timestamps: true
});
const User = mongoose.model("User", userSchema);
export default User;