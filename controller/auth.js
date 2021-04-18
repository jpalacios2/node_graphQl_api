//to check validation results/errors
const {validationResult} = require('express-validator')

//to encrypt passwords
const bcrypt = require('bcryptjs')//user bcryptjs for passwords!

//for web token
const jswt = require('jsonwebtoken')

//to add new Users
const User = require('../models/user')

//exports!
exports.putNewUser = async (req,res,next) =>{

    const errors = validationResult(req)

    if(!errors.isEmpty()){

        const authError = new Error(errors.array()[0].msg)
        authError.statusCode = 500
        authError.data = errors.array()
        throw authError
    }

    const name = req.body.name
    const email = req.body.email
    const password = req.body.password

    const hashedPassword = await bcrypt.hash(password,12)
    let userCreated = false

    try {
        if(hashedPassword)
        {
            const newUser = await new User({
                name: name,
                email: email,
                password: hashedPassword
            })
            
            userCreated = await newUser.save()
    
            if(userCreated)
            {
                res.status(201).json({
                    message: 'New user created!',
                    userId: userCreated._id
                })
            }
        }
    } catch (error) {
        if(error){
            error.status = 401
        }

        next(error)
    }
}

exports.getLogin = async (req,res,next) =>{
    
    const loginInfo = {
        password: req.body.password,
        email: req.body.email
    }
    let loadedUser = undefined
    let didMatch = false
    
    try {
        
        loadedUser = await User.findOne({email: loginInfo.email})


        if(loadedUser)
        {
  
            didMatch = await bcrypt.compare(loginInfo.password, loadedUser.password)

            if(didMatch)
            {
             
                const newToken = await jswt.sign({
                    email: loadedUser.email,
                    userId: loadedUser._id.toString()
                },
                'somesupersecretsecret',
                {
                    expiresIn: '1h'//Token becomes invalid after an hour in case someone steals it
                })

                if(newToken)
                {
                    res.status(200).json({
                        token: newToken,
                        userId: loadedUser._id.toString()
                    })
                    return
                }
            }
        }else{
            const findUserError = new Error('User not found')

            findUserError.statusCode = 401
            throw findUserError
        }

    } catch (error) {
        if(error){
            error.status = 500
        }
        next(error)
        return error
    }
}

exports.getUserStatus = async (req,res,next) =>{
    
    try {
        
        const user = await User.findById(req.userId)

        if(!user)
        {
            const error = new Error('User not found!')
            error.statusCode = 404

            throw error 
        }
        
        res.status(200).json({status: user.status})

    } catch (error) {
        if(error)
        {
            error.statusCode = 500
        }
        next(error)
    }
}