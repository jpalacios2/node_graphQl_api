const {buildSchema} = require('graphql')

module.exports = buildSchema(`

    type Post{
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String
        updatedAt: String
    }

    type User {
        _id: ID!
        name: String!
        email: String!
        password: String
        status: String!
        posts: [Post!]
    }

    type AuthData {
        token: String!
        userId: String!
    }

    type PostData{
        posts: [Post!]!
        total: Int!
    }

    type deleteResponse{
        success: Boolean!
    }

    type Status{
        userStatus: String!
    }

    input UserInputData {
        email: String!
        name: String!
        password: String!
    }

    type RootQuery{
        login(email: String!, password: String!): AuthData!
        getPosts(page: Int): PostData!
        getPost(postId: String!): Post!
        getStatus: Status!
    }

    type RootMutation {
        createUser(userInput: UserInputData): User!
        createPost(title: String!, content: String!, imageUrl: String!): Post!
        editPost(postId: String!, title: String!, content: String!, imageUrl: String!): Post!
        deletePost(postId: String!): deleteResponse!
        updateStatus(newStatus: String!): Status!
    }
 
    schema {
        query: RootQuery
        mutation: RootMutation
    }
`)