//for validation error messages
const {validationResult} = require('express-validator')

//to post to database
const Post = require('../models/post')
const User = require('../models/user')


//to delete images
const fs = require('fs')
const path = require('path')
const { ObjectID } = require('mongodb')
const user = require('../models/user')
//exports!
exports.getFeed = async (req,res,next)=>{

    const currentPage = req.query.page || 1
    const perPage = 2

    try {
//*sideNote = Updates to Node allow you to use await outside of an async function,
//feature known as Top Level Await
        const totalItems = await Post.find().countDocuments()

        const posts = await Post.find().populate('creator').sort({createdAt: -1}).skip((currentPage - 1) * perPage).limit(perPage)

        if(posts && totalItems)
        {
            res.status(200).json({
                message: 'Successfully retrieved posts!',
                posts: posts,
                totalItems: totalItems
            })
        }

    } catch (error) {
        if(error){
            error.statusCode = 500
        }
        next(error)
    }
}


exports.createPost = async (req,res,next)=>{

    const errors = validationResult(req)

    if(!errors.isEmpty()){
        const error = new Error('Validation falied, entered data incorrect')
        error.statusCode = 422
        throw error
    }
    
    if(!req.file){
        const error = new Error('No image attached')
        error.statusCode = 422
        throw error
    }

    let creator = undefined

    const title = req.body.title
    const content = req.body.content
    const imageUrl = req.file.path

    try {

        const newPost = await new Post({
            title: title,
            imageUrl: imageUrl,
            content: content,
            creator: req.userId//this MUST be initialized when creating a new Model, Not outside, to avoid errors!
        }).save()
            
        creator = await User.findById(req.userId)

        if(creator)
        {
            creator.posts.push(newPost)
            creator.save()
        
            res.status(201).json({
                message: 'Post created successfully',
                post: newPost,
                creator: {
                    _id: creator._id,
                    name: creator.name
                }
            })
        }

        return creator
        
    } catch (err) {
        if(!err.statusCode){
            err.statusCode = 500
        }
        next(err)   
    }
}

exports.getPost = async (req,res,next) =>{
    const postId = req.params.postId

    try {
        const post = await Post.findById(postId)

        if(post){
            res.status(200).json({
                message: 'post found',
                post: post
            })
        }
        
    } catch (error) {
        if(error){
            error.statusCode = 500
        }

        next(error)
    } 
}

//to update a post
exports.putPost = async (req,res,next) =>{

    let validationErrors = validationResult(req)

    if(!validationErrors.isEmpty()){
        const error = new Error(validationErrors.array())
        error.statusCode = 422
        throw error
    }

    const userId = req.userId
    const postId = req.params.postId
    const title = req.body.title
    const content = req.body.content
    let imageUrl = req.body.image

    //if we received a new file/image
    if(req.file){
        imageUrl = req.file.path
    }

    //something went wrong, no new image or old image information
    if(!imageUrl){
        const error = new Error('No image data received!')
        error.statusCode = 422
        throw error
    }



    try {
        const post = await Post.findOne({_id: postId,creator: userId}).populate('creator')


        if(post)
        {
            if(imageUrl !== post.imageUrl){
                clearImage(post.imageUrl)
            }
    
            post.title = title
            post.content = content
            post.imageUrl = imageUrl
            
            post.save()

               //use 200 for updating and 201 when creating new resources
            res.status(200).json({
                message: 'Post updated successfully!',
                post: post,
            })
        }
        
    } catch (error) {
        if(error){
            error.statusCode = 500
        }

        next(error)
    }
}

exports.deletePost = async (req,res,next)=>{
    const postId = req.params.postId
    const userId = req.userId

    try {
        const post = await Post.findOne({_id: postId, creator:userId})
        const user = await User.findById(userId)
        let postDeleted = false

        if(post && user)
        {
            clearImage(post.imageUrl)

            user.posts.map((res,i) => 
            {

                if(JSON.stringify(ObjectID(post._id)) === JSON.stringify(ObjectID(res)))
                {
                    user.posts.splice(i,1) //You can use user.posts.pull(index) from Mongoose 
                    user.save().then().catch()
                    post.remove()
                    postDeleted = true
                }
            })

            if(postDeleted)
            {
                res.status(200).json({
                    message: 'Post Deleted Successfully!'
                })
            }
        }
    } catch (error) {
        if(error){
            error.statusCode = 500
        }

        next(error)
    }
}

const clearImage = (filePath)=> {
    let unlinkPath = path.join(__dirname,'..',filePath)

    
    fs.unlink(unlinkPath,(err)=>{
        if(err){
            console.log(err)
            return
        } 
    })
}