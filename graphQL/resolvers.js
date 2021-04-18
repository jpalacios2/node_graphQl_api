const User = require('../models/user')
const Post = require('../models/post')
const bcryptJs = require('bcryptjs')
const validator = require('validator')
const jWebToken = require('jsonwebtoken')
//to delte images
const fs = require('fs')
const path = require('path')
const { ObjectID } = require('mongodb')

module.exports = {
    
    createUser: async function ({userInput}, request)
    {
        const email = userInput.email
        const errors = []

         //if using promise return resolver or else graphQl won't wait
         const existingUser = await User.findOne({email: email})
         if(existingUser)
         {
             const error = new Error('User already exists!')
             throw error
         }

        if(!validator.isEmail(email))
        {
            errors.push({
                message: 'Incorrect Email Entered!'
            })
        }

        const password = userInput.password
        if(validator.isEmpty(password) || !validator.isLength(password,{min: 5, max: 30}))
        {
            errors.push({
                message: 'Please enter a valid password'
            })
        }

        if(errors.length > 0)
        {
            console.log('ERROR on server',errors)

            const validattionError = new Error('Invalid Input!')
            validattionError.data = errors
            validattionError.code = 422

            throw validattionError
        }

        hashedPassword = await bcryptJs.hash(password,12)

        const newUser = await new User({
            email: email,
            name: userInput.name,
            password: hashedPassword
        }).save()

        return {
            ...newUser._doc, 
            _id: newUser._id.toString()
        }
    },
    
    login: async function ({email, password},request){
        
        const errors = []
        const user = await User.findOne({email:email})


        if(!user)
        {
            const noUserFoundErr = new Error('User Not Found!')
            noUserFoundErr.code = 401

            throw noUserFoundErr
        }

        const pwDoesMatch = await bcryptJs.compare(password, user.password)

        if(!pwDoesMatch)
        {
            const pwError = new Error('Incorrect password!')
            pwError.code = 401

            throw pwError
        }

        const newToken = await jWebToken.sign(
        {
            email: email,
            userId: user._id.toString()
        },
        'somesupersecretsecret',
            {
                expiresIn: '1h'
            }
        )

        return {
            token: newToken,
            userId: user._id.toString()
        }
    },

    createPost: async function ({title, content, imageUrl},request)
    {

        if(!request.isAuth)
        {
            const authError = new Error('Unauthenticated user!')
            authError.code = 401

            throw authError
        }

        const errors = []

        if(validator.isEmpty(title) || !validator.isLength(title, { min: 3, max: 30}))
        {
            errors.push({
                message: 'Title too short!'
            })
        }

        if(validator.isEmpty(content) || !validator.isLength(content,{min:5,max:250}))
        {
            errors.push({
                message: 'Content too short!'
            })
        }

        if(validator.isEmpty(imageUrl) || !validator.isLength(imageUrl,{min:3,max:250}))
        {
            errors.push({
                message: 'image-url too short!'
            })
        }

        if(errors.length > 0)
        {
            console.log('ERROR on server',errors)

            const validattionError = new Error('Invalid Input!')
            validattionError.data = errors
            validattionError.code = 422

            throw validattionError
        }

        const user = await User.findById(request.userId)

        if(!user)
        {
            const validattionError = new Error('Invalid user!')
            validattionError.data = errors
            validattionError.code = 401

            throw validattionError
        }

        const newPost = await new Post({
            title: title,
            content: content,
            imageUrl: imageUrl,
            creator: user
        })
        
        const finalizedPost = await newPost.save()

        user.posts.push(finalizedPost)
        await user.save()

        return {
            ...finalizedPost._doc
        }
    },

    getPosts: async function({page},request){        

        //const currentPage = request.query.page || 1
        const perPage = 2

        if(!page) page = 1
        
        if(!request.isAuth)
        {
            const authError = new Error('Unauthenticated user!')
            authError.code = 401

            throw authError
        }

        const total = await Post.find({}).countDocuments()
        const allPosts = await Post.find({})
                                    .sort({createdAt: -1})
                                    .skip((page - 1) * perPage)
                                    .limit(perPage)
                                    .populate('creator')
        
        return {
            posts: allPosts.map(p=>{
                return{
                    ...p._doc,
                    _id: p._id,
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt
                }
            }),
            total: total
        }
    },

    getPost: async function({postId},request){
    
        if(!request.isAuth)
        {
            const authError = new Error('Unauthenticated user!')
            authError.code = 401

            throw authError
        }

        try {
            
            const postToReturn = await Post.findById(postId).populate('creator')


            return {
                ...postToReturn,
                title: postToReturn.title,
                creator: postToReturn.creator,
                imageUrl: postToReturn.imageUrl,
                content: postToReturn.content,
                createdAt: postToReturn.createdAt
            }

        } catch (error) {
            
            const postError = new Error('No post found!')
            postError.code = 404

            return {
                message: postError.message
            }
        }   
    },

    editPost: async function({postId, title, content, imageUrl},request){

        if(!request.isAuth)
        {
            const authError = new Error('Unauthenticated user!')
            authError.code = 401

            throw authError
        }

        const postToEdit = await Post.findOne({_id: postId, creator: request.userId}).populate('creator')

        if(!postToEdit)
        {
            const postError = new Error('No post found!')
            postError.code = 404

            throw postError
        }

        const errors = []

        if(validator.isEmpty(title) || !validator.isLength(title, { min: 3, max: 30}))
        {
            errors.push({
                message: 'Title too short!'
            })
        }

        if(validator.isEmpty(content) || !validator.isLength(content,{min:5,max:250}))
        {
            errors.push({
                message: 'Content too short!'
            })
        }

        if(validator.isEmpty(imageUrl) || !validator.isLength(imageUrl,{min:3,max:250}))
        {
            errors.push({
                message: 'image-url too short!'
            })
        }

        if(errors.length > 0)
        {
            console.log('ERROR on server',errors)

            const validattionError = new Error('Invalid Input!')
            validattionError.data = errors
            validattionError.code = 422

            throw validattionError
        }

        postToEdit.title = title
        postToEdit.content = content

        if(postToEdit.imageUrl !== 'undefined')
        {
            postToEdit.imageUrl = imageUrl
        }

        const updatedPost = await postToEdit.save()

        return{
            ...updatedPost._doc,
            _id: updatedPost._id,
            creator: updatedPost.creator,
            createdAt: updatedPost.createdAt,
            updatedAt: updatedPost.updatedAt

        }
    },

    deletePost: async function({postId},request){
        
        if(!request.isAuth)
        {
            const authError = new Error('Unauthenticated user!')
            authError.code = 401

            throw authError
        }

        const postToDelete = await Post.findOne({_id: postId, creator: request.userId})
    
        if(!postToDelete)
        {
            const postError = new Error('No post found!')
            postError.code = 404

            throw postError
        }

        const userToUpdate = await User.findById(request.userId)
        let deletedPost = undefined

        if(!userToUpdate)
        {
            const postError = new Error('No user found!')
            postError.code = 404

            throw postError
        }

        clearImage(postToDelete.imageUrl)

        userToUpdate.posts.map(async (res,i) => 
        {
            if(JSON.stringify(ObjectID(postId)) === JSON.stringify(ObjectID(res)))
            {
                userToUpdate.posts.splice(i,1) //You can use user.posts.pull(index) from Mongoose 
                userToUpdate.save().then().catch()
            }
        })

        deletedPost = await Post.findByIdAndRemove(postId).populate('creator')

        if(deletedPost)
        {

            return {
                success: true
            }
        }else{
            return {
                success: false
            }
        }
    },

    getStatus: async function(args,request){
        if(!request.isAuth)
        {
            const authError = new Error('Unauthenticated user!')
            authError.code = 401

            throw authError
        }

        const user = await User.findById(request.userId)

        if(!user)
        {
            const userStatusError = new Error('No user found!')
            userStatusError.code = 404

            throw userStatusError
        
        }else{
            return{
                userStatus: user.status
            }
        }
    },

    updateStatus: async function({newStatus},request){
        if(!request.isAuth)
        {
            const authError = new Error('Unauthenticated user!')
            authError.code = 401

            throw authError
        }

        const user = await User.findById(request.userId)

        if(!user)
        {
            const userStatusError = new Error('No user found!')
            userStatusError.code = 404

            throw userStatusError
        
        }else{
            
            user.status = newStatus

            const updatedUser = await user.save()
            
            
            return{
                userStatus: updatedUser.status
            }
        }
    }
}

const clearImage = async (filePath)=> {

    let unlinkPath = undefined

    try {
        unlinkPath = await path.join(__dirname,'..',filePath)
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