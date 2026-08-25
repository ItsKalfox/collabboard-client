import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '15m' } // TTL index: document will expire and be removed after 15 minutes
    }
}, {
    timestamps: true
});

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;
