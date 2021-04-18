const {expect} = require('chai')
const sinon = require('sinon')
const User = require('../models/user')
const feedController = require('../controller/feed')
const mongoose = require('mongoose')
const mongoDB_TEST_URL = 'mongodb+srv://Admin_Simple_API:Jgwthus4y52FEbcx@cluster0.0z8pk.mongodb.net/Simple_Rest_API_TEST_DB?retryWrites=true&w=majority'

const userId = '6021ce5dae9514b2109c0f04'

describe('Test the feed controller',()=>{

    before(function(done){
        mongoose.connect(mongoDB_TEST_URL)
            .then(()=>{
                
                console.log('DID CALL THEN in CONNECT')

                const user = new User({
                    email: 'test@test.com',
                    password: 'tester',
                    name: 'test',
                    posts: [],
                    _id: userId
                })
                
                return user.save()

            })
            .then(()=>{
                done()
            })
    })


  beforeEach(function() {});

  afterEach(function() {});
    
    it('should add a created post to the user post array',function(done){

        const request ={
            body: {
                title: 'test-title',
                content: 'test content',
            },
            file: {
                path: 'xyz'
            },
            userId: userId
        }

        const response = 
        {
            status: function(){
                return this
            },
            json: function(){
                
            }
        }

        feedController.createPost(request,response,()=>{})
            .then((savedUser)=> {

                expect(savedUser).to.have.property('posts')
                expect(savedUser.posts).to.have.length(1)//1 new post added to it
                done()                  
            })

        after(function(done) {
            User.deleteMany({})
                .then(() => {
                    return mongoose.disconnect();
                })
                .then(() => {
                    done();
                });
            });
    })
})