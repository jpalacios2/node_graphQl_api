const path = require('path')
const fs = require('fs')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const mongoDB_URL = 'mongodb+srv://Admin_Simple_API:Jgwthus4y52FEbcx@cluster0.0z8pk.mongodb.net/Simple_Rest_API?retryWrites=true&w=majority'

//GraphQL
const {graphqlHTTP} = require('express-graphql')
const graphQlSchema = require('./graphQL/schema')
const graphQlResolvers = require('./graphQL/resolvers')

//authentition
const auth = require('./middleware/auth')

//for images
const multer = require('multer')

const fileStorage = multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null,'images')
    },
    filename: (req,file,cb)=>{

        let fileName = Date.now()+'_prodName_'+req.body.title+'_'+file.originalname

        cb(null, fileName.replace(/\s+/g,''))
    }
})

const fileFilter = (req,file,cb) =>{
    if( file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jfif'){

        // To accept the file pass `true`, like so:
        cb(null, true)
    }else{
        // To reject this file pass `false`, like so:
        cb(null, false)
        }

    // You can always pass an error if something goes wrong:
    //cb(new Error('I don\'t have a clue!'))
}

//middleware
app.use(bodyParser.json({}))

app.use(multer({
    storage: fileStorage,
    fileFilter: fileFilter
}).single('image'))//pass the same value of the input name that will hold the file

app.use('/images',express.static(path.join(__dirname,'images')))

//set headers to avoid CORS errors in browser
app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*')//could be locked to specific IPs but use wildcard * here
    res.setHeader('Access-Control-Allow-Methods','GET,HEAD, POST, PUT, PATCH, DELETE')//allows Origins to access HTTP Methods
    res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization')
    res.setHeader("preflightContinue", 'false')
    res.setHeader("optionsSuccessStatus", '204')

    if(req.method === 'OPTIONS')
    {
        return res.sendStatus(200)
    }
    next()
})

app.use(auth)

app.put('/post-image',(request, response, next)=>{

    const bodyObj = JSON.parse(JSON.stringify(request.body))
    
    if(!request.isAuth)
    {
        throw new Error('Endpoint error - Un-authenticated!')
    }

    
    if(!request.file && !bodyObj.oldPath)
    {
        return response.status(200).json({
            message: 'Endpoint error - No File Provided!'
        })
    }

    if(bodyObj.oldPath)
    {
        if(bodyObj.oldPath !== bodyObj.image)
        {
            clearImage(bodyObj.oldPath)
        }
    }

    let filePath = undefined

    if(request.file)
    {
        filePath = request.file.path
    }else{
        filePath = bodyObj.image
    }

    return response.status(201).json({
        message: 'File Stored!',
        filePath: filePath
    })
}) 

//graphQl Routes
app.use('/graphql',graphqlHTTP({
    schema: graphQlSchema,
    rootValue: graphQlResolvers,
    graphiql: true,
    customFormatErrorFn: (err)=>{
        if(!err.originalError)
        {
            console.log('IN GRAPH QL ERROR!', err)
            return err
        }

        const data = err.originalError.data
        const message = err.message || 'An error occurred'
        const code = err.originalError.code || 500

        return{
            message: message,
            status: code,
            data: data
        }

    }
}))

app.use((error, req, res, next)=>{
    console.log(error)
    const status = error.statusCode || 500
    const message = error.message
    const data = error.data
    
    res.status(status).json({
        message: message,
        data: data || 'no additional data'
    })
})

mongoose.connect(mongoDB_URL,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})
    .then(()=>{   

        app.listen(8080,(error)=>{
            if(error)
            {
                console.log('Error at line 88 ap js')
                return
            }

            console.log('Connected on 8008')
        })


    })
    .catch((err)=>{
        console.log('MONGO_DB_ERROR:',err.message)
    })

const clearImage = async (filePath)=> {

    let unlinkPath = undefined

    try {
        unlinkPath = await path.join(__dirname,'.',filePath)
    } catch (error) {
        console.log('Error unlinking PATH',error.message)
        return
    }

    fs.unlink(unlinkPath,(err)=>{
        if(err){
            console.log('Unlink error:',err)
            return
        } 
    })
}
