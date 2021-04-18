const {expect} = require('chai')
const sinon = require('sinon')
const User = require('../models/user')
const authController = require('../controller/auth')
const mongoose = require('mongoose')
const mongoDB_TEST_URL = 'mongodb+srv://Admin_Simple_API:Jgwthus4y52FEbcx@cluster0.0z8pk.mongodb.net/Simple_Rest_API_TEST_DB?retryWrites=true&w=majority'


describe('Test the auth controller',()=>{

    before(function(done){
        mongoose.connect(mongoDB_TEST_URL)
            .then(()=>{
                
                console.log('DID CALL THEN in CONNECT')

                const user = new User({
                    email: 'test@test.com',
                    password: 'tester',
                    name: 'test',
                    posts: [],
                    _id: '6021ce5dae9514b2109c0f04'
                })
                
                return user.save()

            })
            .then(()=>{
                done()
            })
    })

    it('Login should fail and throw an error with status code 500 is accessing db fails',(done)=>{

        sinon.stub(User,'findOne')

        User.findOne.throws()
        
        const request = {
            body: 'test@test.com',
            password: 'asdfsdsdf'
        }

        authController.getLogin(request,{},()=>{}).then(res =>{
             
            expect(res).to.be.an('error')
            expect(res).to.have.property('status',500)
            done()
        })
        
        User.findOne.restore()
    })

    
    it('should send a response with a valid user status',(done)=>{
        
        console.log('STARTING MONGOOSE TEST')

        const request ={
            userId: '6021ce5dae9514b2109c0f04'
        }

        const response = 
        {
            statusCode: 500,
            userStatus: null,
            status: function(code){
                this.statusCode = code

                return this
            },
            json: function(data){
                this.userStatus = data.status
            }
        }

        authController.getUserStatus(request,response,()=>{})
            .then(()=> {

                console.log('DID CALL THEN in getStats!')
                console.log(response)

                expect(response.statusCode).to.be.equal(200)
                expect(response.userStatus).to.be.equal('New user here!')
                
                User.deleteMany({})
                    .then(()=>{
                        return mongoose.disconnect()
                    })
                    .then(() => {
                        done()
                    })
                
            })
    })
})