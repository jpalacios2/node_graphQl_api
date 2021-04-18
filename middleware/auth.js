const jswt = require('jsonwebtoken')

module.exports = (req,res,next) =>{
    const authHeader = req.get('Authorization')

    if(!authHeader)
    {
        req.isAuth = false
        
        const error = new Error('Not authenticated')
        error.statusCode = 401
        
        throw error
    }

    const incomingToken = req.get('Authorization').split(' ')[1]

    if(!incomingToken)
    {
        req.isAuth = false
        
        const error = new Error('Token not found')
        error.statusCode = 401
        
        throw error
    }

    let decodedToken = undefined

    try{
        decodedToken = jswt.verify(incomingToken, 'somesupersecretsecret')//verifies and decodes, the secret must be the one used for signing
    }catch (error){
        req.isAuth = false
        
        error.statusCode = 500
        throw error
    }

    if(!decodedToken){//not a complete failure but not verified either
        req.isAuth = false

        const error = new Error('Not authenticated!')
        error.statusCode = 401
        throw error
    }

    //to be used throughout the api for authorization
    req.userId = decodedToken.userId;
    req.isAuth = true
    next()
}