const { GraphQLServer } = require('graphql-yoga')
const fs = require('fs')
const { Binding } = require('./generated/bindings')

const typeDefs = fs.readFileSync('./src/generated/schema.graphql', 'utf-8')
const resolvers = {
  Query: {
    feed(parent, args, ctx, info) {
      return ctx.db.query.posts({ where: { isPublished: true } }, info)
    },
  },
  Mutation: {
    createDraft(parent, { title, text }, ctx, info) {
      return ctx.db.mutation.createPost(
        // TODO remove `isPublished` in favour of default value
        { data: { title, text, isPublished: false } },
        info,
      )
    },
    publish(parent, { id }, ctx, info) {
      return ctx.db.mutation.updatePost(
        {
          where: { id },
          data: { isPublished: true },
        },
        info,
      )
    },
  },
}

const server = new GraphQLServer({
  typeDefs,
  resolvers,
  context: req => ({
    ...req,
    db: new Binding({
      endpoint: 'https://database-beta.graph.cool/api/node-graphql-server-static/dev',
      secret: 'mysecret123',
    }),
  }),
})

server.start(() => console.log('Server is running on http://localhost:4000'))
