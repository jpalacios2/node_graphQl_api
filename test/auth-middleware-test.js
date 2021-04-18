const {expect} = require('chai')
const authMiddleware = require('../middleware/auth')
const jwt = require('jsonwebtoken')
const sinon = require('sinon')

//!DO NOT TEST 3rd party packages

//group unit tests with describe
describe('Auth middleware',function(){

    //unit tests of isAuth header check
    it('should throw an error if no authorization header is present',function(){
        const request = {
            get: function(headerName){
                return null
            }
        }

        expect(authMiddleware.bind(this, request, {}, ()=>{})).to.throw('Not authenticated')
    })

    it('should throw an error is authorization header is only one string, missing token',function(){

        const request = {
            get: function(headerName){
                return 'Beaurer'
            }
        }

        expect(authMiddleware.bind(this,request,{},()=>{})).to.throw('Token not found')
    })

    it('should throw an error if the token cannot be verified',()=>{

        const request = {
            get: (headerName)=>{
                return 'Bearer xyz'
            }
        }

        expect(authMiddleware.bind(this,request,{},()=>{})).to.throw()

    })

    it('should add userId to request',()=>{

        const request = {
            get: (headerName)=>{
                return 'Bearer xyzsdadasd64354sad'
            }
        }
        
        //override functions that we won't be able to test, typically from 3rd party packages, using a Stub
        //can cause other tests to malfunction if they depend on the method because method is changed globally
        //you would want to RESTORE the original method, use sinon package for this
        /*
        jwt.verify = ()=>{
            return {userId: 'test123'}
        }
        */
       sinon.stub(jwt,'verify')
       jwt.verify.returns({userId: 'test123'})

        authMiddleware(request,{},()=>{})
        expect(request).to.have.property('userId')
        expect(request).to.have.property('userId', 'test123')
        expect(jwt.verify.called).to.be.true
        //this will restore the method to avoid malfuctions elsewhere
        jwt.verify.restore()

    })
})