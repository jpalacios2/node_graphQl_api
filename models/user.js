const {Schema, model} = require('mongoose')

const userSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    status:{
        type: String,
        default: 'New user here!'
    },
    posts:[
        {
            type: Schema.Types.ObjectId,
            ref:'Post'
        }
    ]
},{
    timestamps: true
})

module.exports = model('User',userSchema)