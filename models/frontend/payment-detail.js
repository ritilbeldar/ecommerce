const mongoose = require('mongoose')

const paymentDetailsSchema = new mongoose.Schema({
	orderId: {
		type: String,
		required: true
	},
	receiptId: {
		type: String
	},
	paymentId: {
		type: String,
	},
	signature: {
		type: String,
	},
	amount: {
		type: Number
	},
	currency: {
		type: String
	},
	createdAt: {
		type: Date
	},
	status: {
		type: String
	}
},
{ timestamps: true }
)

module.exports = mongoose.model('PaymentDetail', paymentDetailsSchema)