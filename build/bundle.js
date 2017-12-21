/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

const { GraphQLServer } = __webpack_require__(1);

const typeDefs = __webpack_require__(2);
const { Binding } = __webpack_require__(3);

const resolvers = {
  Query: {
    feed(parent, args, ctx, info) {
      return ctx.db.query.posts({ where: { isPublished: true } }, info);
    }
  },
  Mutation: {
    createDraft(parent, { title, text }, ctx, info) {
      return ctx.db.mutation.createPost(
      // TODO remove `isPublished` in favour of default value
      { data: { title, text, isPublished: false } }, info);
    },
    publish(parent, { id }, ctx, info) {
      return ctx.db.mutation.updatePost({
        where: { id },
        data: { isPublished: true }
      }, info);
    }
  }
};

const server = new GraphQLServer({
  typeDefs,
  resolvers,
  context: req => _extends({}, req, {
    db: new Binding({
      endpoint: 'https://database-beta.graph.cool/api/node-graphql-server-static/dev',
      secret: 'mysecret123'
    })
  })
});

server.start(() => console.log('Server is running on http://localhost:4000'));

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("graphql-yoga");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = "type Query {\n  feed: [Post!]!\n}\n\ntype Mutation {\n  createDraft(title: String!, text: String): Post\n  publish(id: ID!): Post\n}\n\ntype Post implements Node {\n  id: ID!\n  isPublished: Boolean!\n  title: String!\n  text: String!\n}\n\ninterface Node {\n  id: ID!\n}\n"

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

const { FragmentReplacements } = __webpack_require__(4);
const { GraphcoolLink } = __webpack_require__(5);
const { buildFragmentInfo, buildTypeLevelInfo } = __webpack_require__(6);
const { GraphQLResolveInfo, GraphQLSchema } = __webpack_require__(7);
const { GraphQLClient } = __webpack_require__(8);
const { SchemaCache } = __webpack_require__(9);
const { delegateToSchema } = __webpack_require__(10);
const { sign } = __webpack_require__(11);

// -------------------
// This should be in graphcool-binding
const schemaCache = new SchemaCache()

class BaseBinding {
  constructor({
    typeDefs,
    endpoint,
    secret,
    fragmentReplacements}) {
    
    fragmentReplacements = fragmentReplacements || {}

    const token = sign({}, secret)
    const link = new GraphcoolLink(endpoint, token)

    this.remoteSchema = schemaCache.makeExecutableSchema({
      link,
      typeDefs,
      key: endpoint,
    })

    this.fragmentReplacements = fragmentReplacements

    this.graphqlClient = new GraphQLClient(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  delegate(operation, prop, args, info) {
    if (!info) {
      info = buildTypeLevelInfo(prop, this.remoteSchema, operation)
    } else if (typeof info === 'string') {
      info = buildFragmentInfo(prop, this.remoteSchema, operation, info)
    }

    return delegateToSchema(
      this.remoteSchema,
      this.fragmentReplacements,
      operation,
      prop,
      args || {},
      {},
      info,
    )
  }

  async request(
    query,
    variables
  ) {
    return this.graphqlClient.request(query, variables)
  }
}
// -------------------

const typeDefs = `
type Post implements Node {
  id: ID!
  isPublished: Boolean!
  title: String!
  text: String!
}

type Mutation {
  createPost(data: PostCreateInput!): Post!
  updatePost(data: PostUpdateInput!, where: PostWhereUniqueInput!): Post
  deletePost(where: PostWhereUniqueInput!): Post
  upsertPost(where: PostWhereUniqueInput!, create: PostCreateInput!, update: PostUpdateInput!): Post!
  resetData: Boolean
}

interface Node {
  id: ID!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type PostConnection {
  pageInfo: PageInfo!
  edges: [PostEdge]
}

input PostCreateInput {
  isPublished: Boolean!
  title: String!
  text: String!
}

type PostEdge {
  node: Post!
  cursor: String!
}

enum PostOrderByInput {
  id_ASC
  id_DESC
  isPublished_ASC
  isPublished_DESC
  title_ASC
  title_DESC
  text_ASC
  text_DESC
}

input PostUpdateInput {
  isPublished: Boolean
  title: String
  text: String
}

input PostWhereInput {
  AND: [PostWhereInput!]
  OR: [PostWhereInput!]
  id: ID
  id_not: ID
  id_in: [ID!]
  id_not_in: [ID!]
  id_lt: ID
  id_lte: ID
  id_gt: ID
  id_gte: ID
  id_contains: ID
  id_not_contains: ID
  id_starts_with: ID
  id_not_starts_with: ID
  id_ends_with: ID
  id_not_ends_with: ID
  isPublished: Boolean
  isPublished_not: Boolean
  title: String
  title_not: String
  title_in: [String!]
  title_not_in: [String!]
  title_lt: String
  title_lte: String
  title_gt: String
  title_gte: String
  title_contains: String
  title_not_contains: String
  title_starts_with: String
  title_not_starts_with: String
  title_ends_with: String
  title_not_ends_with: String
  text: String
  text_not: String
  text_in: [String!]
  text_not_in: [String!]
  text_lt: String
  text_lte: String
  text_gt: String
  text_gte: String
  text_contains: String
  text_not_contains: String
  text_starts_with: String
  text_not_starts_with: String
  text_ends_with: String
  text_not_ends_with: String
}

input PostWhereUniqueInput {
  id: ID
}

type Query {
  posts(where: PostWhereInput, orderBy: PostOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Post]!
  post(where: PostWhereUniqueInput!): Post
  postsConnection(where: PostWhereInput, orderBy: PostOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): PostConnection!
  node(id: ID!): Node
}
`

module.exports.Binding = class Binding extends BaseBinding {
  
  constructor({ endpoint, secret, fragmentReplacements}) {
    super({ typeDefs, endpoint, secret, fragmentReplacements});

    var self = this
    this.query = {
      posts(args, info) { 
        return self.delegate('query', 'posts', args, info)
      },
      post(args, info) { 
        return self.delegate('query', 'post', args, info)
      },
      postsConnection(args, info) { 
        return self.delegate('query', 'postsConnection', args, info)
      },
      node(args, info) { 
        return self.delegate('query', 'node', args, info)
      }
    }
      
    this.mutation = {
      createPost(args, info) { 
        return self.delegate('mutation', 'createPost', args, info)
      },
      updatePost(args, info) { 
        return self.delegate('mutation', 'updatePost', args, info)
      },
      deletePost(args, info) { 
        return self.delegate('mutation', 'deletePost', args, info)
      },
      upsertPost(args, info) { 
        return self.delegate('mutation', 'upsertPost', args, info)
      },
      resetData(args, info) { 
        return self.delegate('mutation', 'resetData', args, info)
      }
    }
  }
  
  delegate(operation, field, args, info) {
    return super.delegate(operation, field, args, info)
  }
}

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("graphcool-binding/dist/src/extractFragmentReplacements");

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = require("graphcool-binding/dist/src/GraphcoolLink");

/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = require("graphcool-binding/dist/src/prepareInfo");

/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("graphql");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("graphql-request");

/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = require("graphql-schema-cache");

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = require("graphql-tools");

/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = require("jsonwebtoken");

/***/ })
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMDQ1N2UxMzRlMDMzZjM3MGMwMGMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy9leHRlcm5hbCBcImdyYXBocWwteW9nYVwiIiwid2VicGFjazovLy8uL3NyYy9zY2hlbWEuZ3JhcGhxbCIsIndlYnBhY2s6Ly8vLi9kYXRhYmFzZS9zY2hlbWEuZ2VuZXJhdGVkLmdyYXBocWwiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwiZ3JhcGhjb29sLWJpbmRpbmcvZGlzdC9zcmMvZXh0cmFjdEZyYWdtZW50UmVwbGFjZW1lbnRzXCIiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwiZ3JhcGhjb29sLWJpbmRpbmcvZGlzdC9zcmMvR3JhcGhjb29sTGlua1wiIiwid2VicGFjazovLy9leHRlcm5hbCBcImdyYXBoY29vbC1iaW5kaW5nL2Rpc3Qvc3JjL3ByZXBhcmVJbmZvXCIiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwiZ3JhcGhxbFwiIiwid2VicGFjazovLy9leHRlcm5hbCBcImdyYXBocWwtcmVxdWVzdFwiIiwid2VicGFjazovLy9leHRlcm5hbCBcImdyYXBocWwtc2NoZW1hLWNhY2hlXCIiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwiZ3JhcGhxbC10b29sc1wiIiwid2VicGFjazovLy9leHRlcm5hbCBcImpzb253ZWJ0b2tlblwiIl0sIm5hbWVzIjpbIkdyYXBoUUxTZXJ2ZXIiLCJyZXF1aXJlIiwidHlwZURlZnMiLCJCaW5kaW5nIiwicmVzb2x2ZXJzIiwiUXVlcnkiLCJmZWVkIiwicGFyZW50IiwiYXJncyIsImN0eCIsImluZm8iLCJkYiIsInF1ZXJ5IiwicG9zdHMiLCJ3aGVyZSIsImlzUHVibGlzaGVkIiwiTXV0YXRpb24iLCJjcmVhdGVEcmFmdCIsInRpdGxlIiwidGV4dCIsIm11dGF0aW9uIiwiY3JlYXRlUG9zdCIsImRhdGEiLCJwdWJsaXNoIiwiaWQiLCJ1cGRhdGVQb3N0Iiwic2VydmVyIiwiY29udGV4dCIsInJlcSIsImVuZHBvaW50Iiwic2VjcmV0Iiwic3RhcnQiLCJjb25zb2xlIiwibG9nIl0sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7OztBQzdEQSxNQUFNLEVBQUVBLGFBQUYsS0FBb0IsbUJBQUFDLENBQVEsQ0FBUixDQUExQjs7QUFFQSxNQUFNQyxXQUFXLG1CQUFBRCxDQUFRLENBQVIsQ0FBakI7QUFDQSxNQUFNLEVBQUVFLE9BQUYsS0FBYyxtQkFBQUYsQ0FBUSxDQUFSLENBQXBCOztBQUVBLE1BQU1HLFlBQVk7QUFDaEJDLFNBQU87QUFDTEMsU0FBS0MsTUFBTCxFQUFhQyxJQUFiLEVBQW1CQyxHQUFuQixFQUF3QkMsSUFBeEIsRUFBOEI7QUFDNUIsYUFBT0QsSUFBSUUsRUFBSixDQUFPQyxLQUFQLENBQWFDLEtBQWIsQ0FBbUIsRUFBRUMsT0FBTyxFQUFFQyxhQUFhLElBQWYsRUFBVCxFQUFuQixFQUFxREwsSUFBckQsQ0FBUDtBQUNEO0FBSEksR0FEUztBQU1oQk0sWUFBVTtBQUNSQyxnQkFBWVYsTUFBWixFQUFvQixFQUFFVyxLQUFGLEVBQVNDLElBQVQsRUFBcEIsRUFBcUNWLEdBQXJDLEVBQTBDQyxJQUExQyxFQUFnRDtBQUM5QyxhQUFPRCxJQUFJRSxFQUFKLENBQU9TLFFBQVAsQ0FBZ0JDLFVBQWhCO0FBQ0w7QUFD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QSw4QjtBQUNBO0FBQ0EsT0FBTztBQUNQLDhCO0FBQ0E7QUFDQSxPQUFPO0FBQ1AsOEI7QUFDQTtBQUNBLE9BQU87QUFDUCw4QjtBQUNBO0FBQ0EsT0FBTztBQUNQLDZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsQzs7Ozs7O0FDck9BLG1GOzs7Ozs7QUNBQSxxRTs7Ozs7O0FDQUEsbUU7Ozs7OztBQ0FBLG9DOzs7Ozs7QUNBQSw0Qzs7Ozs7O0FDQUEsaUQ7Ozs7OztBQ0FBLDBDOzs7Ozs7QUNBQSx5QyIsImZpbGUiOiIuL2J1aWxkL2J1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwge1xuIFx0XHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcbiBcdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG4gXHRcdFx0XHRnZXQ6IGdldHRlclxuIFx0XHRcdH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IDApO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIHdlYnBhY2svYm9vdHN0cmFwIDA0NTdlMTM0ZTAzM2YzNzBjMDBjIiwiY29uc3QgeyBHcmFwaFFMU2VydmVyIH0gPSByZXF1aXJlKCdncmFwaHFsLXlvZ2EnKVxyXG5cclxuY29uc3QgdHlwZURlZnMgPSByZXF1aXJlKCchIXJhdy1sb2FkZXIhYnVuZGxlLWxvYWRlciEuL3NjaGVtYS5ncmFwaHFsJylcclxuY29uc3QgeyBCaW5kaW5nIH0gPSByZXF1aXJlKCchIWJpbmRpbmctbG9hZGVyIWJ1bmRsZS1sb2FkZXIhLi4vZGF0YWJhc2Uvc2NoZW1hLmdlbmVyYXRlZC5ncmFwaHFsJylcclxuXHJcbmNvbnN0IHJlc29sdmVycyA9IHtcclxuICBRdWVyeToge1xyXG4gICAgZmVlZChwYXJlbnQsIGFyZ3MsIGN0eCwgaW5mbykge1xyXG4gICAgICByZXR1cm4gY3R4LmRiLnF1ZXJ5LnBvc3RzKHsgd2hlcmU6IHsgaXNQdWJsaXNoZWQ6IHRydWUgfSB9LCBpbmZvKVxyXG4gICAgfSxcclxuICB9LFxyXG4gIE11dGF0aW9uOiB7XHJcbiAgICBjcmVhdGVEcmFmdChwYXJlbnQsIHsgdGl0bGUsIHRleHQgfSwgY3R4LCBpbmZvKSB7XHJcbiAgICAgIHJldHVybiBjdHguZGIubXV0YXRpb24uY3JlYXRlUG9zdChcclxuICAgICAgICAvLyBUT0RPIHJlbW92ZSBgaXNQdWJsaXNoZWRgIGluIGZhdm91ciBvZiBkZWZhdWx0IHZhbHVlXHJcbiAgICAgICAgeyBkYXRhOiB7IHRpdGxlLCB0ZXh0LCBpc1B1Ymxpc2hlZDogZmFsc2UgfSB9LFxyXG4gICAgICAgIGluZm8sXHJcbiAgICAgIClcclxuICAgIH0sXHJcbiAgICBwdWJsaXNoKHBhcmVudCwgeyBpZCB9LCBjdHgsIGluZm8pIHtcclxuICAgICAgcmV0dXJuIGN0eC5kYi5tdXRhdGlvbi51cGRhdGVQb3N0KFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHdoZXJlOiB7IGlkIH0sXHJcbiAgICAgICAgICBkYXRhOiB7IGlzUHVibGlzaGVkOiB0cnVlIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICBpbmZvLFxyXG4gICAgICApXHJcbiAgICB9LFxyXG4gIH0sXHJcbn1cclxuXHJcbmNvbnN0IHNlcnZlciA9IG5ldyBHcmFwaFFMU2VydmVyKHtcclxuICB0eXBlRGVmcyxcclxuICByZXNvbHZlcnMsXHJcbiAgY29udGV4dDogcmVxID0+ICh7XHJcbiAgICAuLi5yZXEsXHJcbiAgICBkYjogbmV3IEJpbmRpbmcoe1xyXG4gICAgICBlbmRwb2ludDogJ2h0dHBzOi8vZGF0YWJhc2UtYmV0YS5ncmFwaC5jb29sL2FwaS9ub2RlLWdyYXBocWwtc2VydmVyLXN0YXRpYy9kZXYnLFxyXG4gICAgICBzZWNyZXQ6ICdteXNlY3JldDEyMycsXHJcbiAgICB9KSxcclxuICB9KSxcclxufSlcclxuXHJcbnNlcnZlci5zdGFydCgoKSA9PiBjb25zb2xlLmxvZygnU2VydmVyIGlzIHJ1bm5pbmcgb24gaHR0cDovL2xvY2FsaG9zdDo0MDAwJykpXHJcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9pbmRleC5qcyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImdyYXBocWwteW9nYVwiKTtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyBleHRlcm5hbCBcImdyYXBocWwteW9nYVwiXG4vLyBtb2R1bGUgaWQgPSAxXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIm1vZHVsZS5leHBvcnRzID0gXCJ0eXBlIFF1ZXJ5IHtcXG4gIGZlZWQ6IFtQb3N0IV0hXFxufVxcblxcbnR5cGUgTXV0YXRpb24ge1xcbiAgY3JlYXRlRHJhZnQodGl0bGU6IFN0cmluZyEsIHRleHQ6IFN0cmluZyk6IFBvc3RcXG4gIHB1Ymxpc2goaWQ6IElEISk6IFBvc3RcXG59XFxuXFxudHlwZSBQb3N0IGltcGxlbWVudHMgTm9kZSB7XFxuICBpZDogSUQhXFxuICBpc1B1Ymxpc2hlZDogQm9vbGVhbiFcXG4gIHRpdGxlOiBTdHJpbmchXFxuICB0ZXh0OiBTdHJpbmchXFxufVxcblxcbmludGVyZmFjZSBOb2RlIHtcXG4gIGlkOiBJRCFcXG59XFxuXCJcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9yYXctbG9hZGVyIS4vbG9hZGVycy9idW5kbGUuanMhLi9zcmMvc2NoZW1hLmdyYXBocWxcbi8vIG1vZHVsZSBpZCA9IDJcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiY29uc3QgeyBGcmFnbWVudFJlcGxhY2VtZW50cyB9ID0gcmVxdWlyZSgnZ3JhcGhjb29sLWJpbmRpbmcvZGlzdC9zcmMvZXh0cmFjdEZyYWdtZW50UmVwbGFjZW1lbnRzJyk7XG5jb25zdCB7IEdyYXBoY29vbExpbmsgfSA9IHJlcXVpcmUoJ2dyYXBoY29vbC1iaW5kaW5nL2Rpc3Qvc3JjL0dyYXBoY29vbExpbmsnKTtcbmNvbnN0IHsgYnVpbGRGcmFnbWVudEluZm8sIGJ1aWxkVHlwZUxldmVsSW5mbyB9ID0gcmVxdWlyZSgnZ3JhcGhjb29sLWJpbmRpbmcvZGlzdC9zcmMvcHJlcGFyZUluZm8nKTtcbmNvbnN0IHsgR3JhcGhRTFJlc29sdmVJbmZvLCBHcmFwaFFMU2NoZW1hIH0gPSByZXF1aXJlKCdncmFwaHFsJyk7XG5jb25zdCB7IEdyYXBoUUxDbGllbnQgfSA9IHJlcXVpcmUoJ2dyYXBocWwtcmVxdWVzdCcpO1xuY29uc3QgeyBTY2hlbWFDYWNoZSB9ID0gcmVxdWlyZSgnZ3JhcGhxbC1zY2hlbWEtY2FjaGUnKTtcbmNvbnN0IHsgZGVsZWdhdGVUb1NjaGVtYSB9ID0gcmVxdWlyZSgnZ3JhcGhxbC10b29scycpO1xuY29uc3QgeyBzaWduIH0gPSByZXF1aXJlKCdqc29ud2VidG9rZW4nKTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gVGhpcyBzaG91bGQgYmUgaW4gZ3JhcGhjb29sLWJpbmRpbmdcbmNvbnN0IHNjaGVtYUNhY2hlID0gbmV3IFNjaGVtYUNhY2hlKClcblxuY2xhc3MgQmFzZUJpbmRpbmcge1xuICBjb25zdHJ1Y3Rvcih7XG4gICAgdHlwZURlZnMsXG4gICAgZW5kcG9pbnQsXG4gICAgc2VjcmV0LFxuICAgIGZyYWdtZW50UmVwbGFjZW1lbnRzfSkge1xuICAgIFxuICAgIGZyYWdtZW50UmVwbGFjZW1lbnRzID0gZnJhZ21lbnRSZXBsYWNlbWVudHMgfHwge31cblxuICAgIGNvbnN0IHRva2VuID0gc2lnbih7fSwgc2VjcmV0KVxuICAgIGNvbnN0IGxpbmsgPSBuZXcgR3JhcGhjb29sTGluayhlbmRwb2ludCwgdG9rZW4pXG5cbiAgICB0aGlzLnJlbW90ZVNjaGVtYSA9IHNjaGVtYUNhY2hlLm1ha2VFeGVjdXRhYmxlU2NoZW1hKHtcbiAgICAgIGxpbmssXG4gICAgICB0eXBlRGVmcyxcbiAgICAgIGtleTogZW5kcG9pbnQsXG4gICAgfSlcblxuICAgIHRoaXMuZnJhZ21lbnRSZXBsYWNlbWVudHMgPSBmcmFnbWVudFJlcGxhY2VtZW50c1xuXG4gICAgdGhpcy5ncmFwaHFsQ2xpZW50ID0gbmV3IEdyYXBoUUxDbGllbnQoZW5kcG9pbnQsIHtcbiAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rva2VufWAgfSxcbiAgICB9KVxuICB9XG5cbiAgZGVsZWdhdGUob3BlcmF0aW9uLCBwcm9wLCBhcmdzLCBpbmZvKSB7XG4gICAgaWYgKCFpbmZvKSB7XG4gICAgICBpbmZvID0gYnVpbGRUeXBlTGV2ZWxJbmZvKHByb3AsIHRoaXMucmVtb3RlU2NoZW1hLCBvcGVyYXRpb24pXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgaW5mbyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGluZm8gPSBidWlsZEZyYWdtZW50SW5mbyhwcm9wLCB0aGlzLnJlbW90ZVNjaGVtYSwgb3BlcmF0aW9uLCBpbmZvKVxuICAgIH1cblxuICAgIHJldHVybiBkZWxlZ2F0ZVRvU2NoZW1hKFxuICAgICAgdGhpcy5yZW1vdGVTY2hlbWEsXG4gICAgICB0aGlzLmZyYWdtZW50UmVwbGFjZW1lbnRzLFxuICAgICAgb3BlcmF0aW9uLFxuICAgICAgcHJvcCxcbiAgICAgIGFyZ3MgfHwge30sXG4gICAgICB7fSxcbiAgICAgIGluZm8sXG4gICAgKVxuICB9XG5cbiAgYXN5bmMgcmVxdWVzdChcbiAgICBxdWVyeSxcbiAgICB2YXJpYWJsZXNcbiAgKSB7XG4gICAgcmV0dXJuIHRoaXMuZ3JhcGhxbENsaWVudC5yZXF1ZXN0KHF1ZXJ5LCB2YXJpYWJsZXMpXG4gIH1cbn1cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY29uc3QgdHlwZURlZnMgPSBgXG50eXBlIFBvc3QgaW1wbGVtZW50cyBOb2RlIHtcbiAgaWQ6IElEIVxuICBpc1B1Ymxpc2hlZDogQm9vbGVhbiFcbiAgdGl0bGU6IFN0cmluZyFcbiAgdGV4dDogU3RyaW5nIVxufVxuXG50eXBlIE11dGF0aW9uIHtcbiAgY3JlYXRlUG9zdChkYXRhOiBQb3N0Q3JlYXRlSW5wdXQhKTogUG9zdCFcbiAgdXBkYXRlUG9zdChkYXRhOiBQb3N0VXBkYXRlSW5wdXQhLCB3aGVyZTogUG9zdFdoZXJlVW5pcXVlSW5wdXQhKTogUG9zdFxuICBkZWxldGVQb3N0KHdoZXJlOiBQb3N0V2hlcmVVbmlxdWVJbnB1dCEpOiBQb3N0XG4gIHVwc2VydFBvc3Qod2hlcmU6IFBvc3RXaGVyZVVuaXF1ZUlucHV0ISwgY3JlYXRlOiBQb3N0Q3JlYXRlSW5wdXQhLCB1cGRhdGU6IFBvc3RVcGRhdGVJbnB1dCEpOiBQb3N0IVxuICByZXNldERhdGE6IEJvb2xlYW5cbn1cblxuaW50ZXJmYWNlIE5vZGUge1xuICBpZDogSUQhXG59XG5cbnR5cGUgUGFnZUluZm8ge1xuICBoYXNOZXh0UGFnZTogQm9vbGVhbiFcbiAgaGFzUHJldmlvdXNQYWdlOiBCb29sZWFuIVxuICBzdGFydEN1cnNvcjogU3RyaW5nXG4gIGVuZEN1cnNvcjogU3RyaW5nXG59XG5cbnR5cGUgUG9zdENvbm5lY3Rpb24ge1xuICBwYWdlSW5mbzogUGFnZUluZm8hXG4gIGVkZ2VzOiBbUG9zdEVkZ2VdXG59XG5cbmlucHV0IFBvc3RDcmVhdGVJbnB1dCB7XG4gIGlzUHVibGlzaGVkOiBCb29sZWFuIVxuICB0aXRsZTogU3RyaW5nIVxuICB0ZXh0OiBTdHJpbmchXG59XG5cbnR5cGUgUG9zdEVkZ2Uge1xuICBub2RlOiBQb3N0IVxuICBjdXJzb3I6IFN0cmluZyFcbn1cblxuZW51bSBQb3N0T3JkZXJCeUlucHV0IHtcbiAgaWRfQVNDXG4gIGlkX0RFU0NcbiAgaXNQdWJsaXNoZWRfQVNDXG4gIGlzUHVibGlzaGVkX0RFU0NcbiAgdGl0bGVfQVNDXG4gIHRpdGxlX0RFU0NcbiAgdGV4dF9BU0NcbiAgdGV4dF9ERVNDXG59XG5cbmlucHV0IFBvc3RVcGRhdGVJbnB1dCB7XG4gIGlzUHVibGlzaGVkOiBCb29sZWFuXG4gIHRpdGxlOiBTdHJpbmdcbiAgdGV4dDogU3RyaW5nXG59XG5cbmlucHV0IFBvc3RXaGVyZUlucHV0IHtcbiAgQU5EOiBbUG9zdFdoZXJlSW5wdXQhXVxuICBPUjogW1Bvc3RXaGVyZUlucHV0IV1cbiAgaWQ6IElEXG4gIGlkX25vdDogSURcbiAgaWRfaW46IFtJRCFdXG4gIGlkX25vdF9pbjogW0lEIV1cbiAgaWRfbHQ6IElEXG4gIGlkX2x0ZTogSURcbiAgaWRfZ3Q6IElEXG4gIGlkX2d0ZTogSURcbiAgaWRfY29udGFpbnM6IElEXG4gIGlkX25vdF9jb250YWluczogSURcbiAgaWRfc3RhcnRzX3dpdGg6IElEXG4gIGlkX25vdF9zdGFydHNfd2l0aDogSURcbiAgaWRfZW5kc193aXRoOiBJRFxuICBpZF9ub3RfZW5kc193aXRoOiBJRFxuICBpc1B1Ymxpc2hlZDogQm9vbGVhblxuICBpc1B1Ymxpc2hlZF9ub3Q6IEJvb2xlYW5cbiAgdGl0bGU6IFN0cmluZ1xuICB0aXRsZV9ub3Q6IFN0cmluZ1xuICB0aXRsZV9pbjogW1N0cmluZyFdXG4gIHRpdGxlX25vdF9pbjogW1N0cmluZyFdXG4gIHRpdGxlX2x0OiBTdHJpbmdcbiAgdGl0bGVfbHRlOiBTdHJpbmdcbiAgdGl0bGVfZ3Q6IFN0cmluZ1xuICB0aXRsZV9ndGU6IFN0cmluZ1xuICB0aXRsZV9jb250YWluczogU3RyaW5nXG4gIHRpdGxlX25vdF9jb250YWluczogU3RyaW5nXG4gIHRpdGxlX3N0YXJ0c193aXRoOiBTdHJpbmdcbiAgdGl0bGVfbm90X3N0YXJ0c193aXRoOiBTdHJpbmdcbiAgdGl0bGVfZW5kc193aXRoOiBTdHJpbmdcbiAgdGl0bGVfbm90X2VuZHNfd2l0aDogU3RyaW5nXG4gIHRleHQ6IFN0cmluZ1xuICB0ZXh0X25vdDogU3RyaW5nXG4gIHRleHRfaW46IFtTdHJpbmchXVxuICB0ZXh0X25vdF9pbjogW1N0cmluZyFdXG4gIHRleHRfbHQ6IFN0cmluZ1xuICB0ZXh0X2x0ZTogU3RyaW5nXG4gIHRleHRfZ3Q6IFN0cmluZ1xuICB0ZXh0X2d0ZTogU3RyaW5nXG4gIHRleHRfY29udGFpbnM6IFN0cmluZ1xuICB0ZXh0X25vdF9jb250YWluczogU3RyaW5nXG4gIHRleHRfc3RhcnRzX3dpdGg6IFN0cmluZ1xuICB0ZXh0X25vdF9zdGFydHNfd2l0aDogU3RyaW5nXG4gIHRleHRfZW5kc193aXRoOiBTdHJpbmdcbiAgdGV4dF9ub3RfZW5kc193aXRoOiBTdHJpbmdcbn1cblxuaW5wdXQgUG9zdFdoZXJlVW5pcXVlSW5wdXQge1xuICBpZDogSURcbn1cblxudHlwZSBRdWVyeSB7XG4gIHBvc3RzKHdoZXJlOiBQb3N0V2hlcmVJbnB1dCwgb3JkZXJCeTogUG9zdE9yZGVyQnlJbnB1dCwgc2tpcDogSW50LCBhZnRlcjogU3RyaW5nLCBiZWZvcmU6IFN0cmluZywgZmlyc3Q6IEludCwgbGFzdDogSW50KTogW1Bvc3RdIVxuICBwb3N0KHdoZXJlOiBQb3N0V2hlcmVVbmlxdWVJbnB1dCEpOiBQb3N0XG4gIHBvc3RzQ29ubmVjdGlvbih3aGVyZTogUG9zdFdoZXJlSW5wdXQsIG9yZGVyQnk6IFBvc3RPcmRlckJ5SW5wdXQsIHNraXA6IEludCwgYWZ0ZXI6IFN0cmluZywgYmVmb3JlOiBTdHJpbmcsIGZpcnN0OiBJbnQsIGxhc3Q6IEludCk6IFBvc3RDb25uZWN0aW9uIVxuICBub2RlKGlkOiBJRCEpOiBOb2RlXG59XG5gXG5cbm1vZHVsZS5leHBvcnRzLkJpbmRpbmcgPSBjbGFzcyBCaW5kaW5nIGV4dGVuZHMgQmFzZUJpbmRpbmcge1xuICBcbiAgY29uc3RydWN0b3IoeyBlbmRwb2ludCwgc2VjcmV0LCBmcmFnbWVudFJlcGxhY2VtZW50c30pIHtcbiAgICBzdXBlcih7IHR5cGVEZWZzLCBlbmRwb2ludCwgc2VjcmV0LCBmcmFnbWVudFJlcGxhY2VtZW50c30pO1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgdGhpcy5xdWVyeSA9IHtcbiAgICAgIHBvc3RzKGFyZ3MsIGluZm8pIHsgXG4gICAgICAgIHJldHVybiBzZWxmLmRlbGVnYXRlKCdxdWVyeScsICdwb3N0cycsIGFyZ3MsIGluZm8pXG4gICAgICB9LFxuICAgICAgcG9zdChhcmdzLCBpbmZvKSB7IFxuICAgICAgICByZXR1cm4gc2VsZi5kZWxlZ2F0ZSgncXVlcnknLCAncG9zdCcsIGFyZ3MsIGluZm8pXG4gICAgICB9LFxuICAgICAgcG9zdHNDb25uZWN0aW9uKGFyZ3MsIGluZm8pIHsgXG4gICAgICAgIHJldHVybiBzZWxmLmRlbGVnYXRlKCdxdWVyeScsICdwb3N0c0Nvbm5lY3Rpb24nLCBhcmdzLCBpbmZvKVxuICAgICAgfSxcbiAgICAgIG5vZGUoYXJncywgaW5mbykgeyBcbiAgICAgICAgcmV0dXJuIHNlbGYuZGVsZWdhdGUoJ3F1ZXJ5JywgJ25vZGUnLCBhcmdzLCBpbmZvKVxuICAgICAgfVxuICAgIH1cbiAgICAgIFxuICAgIHRoaXMubXV0YXRpb24gPSB7XG4gICAgICBjcmVhdGVQb3N0KGFyZ3MsIGluZm8pIHsgXG4gICAgICAgIHJldHVybiBzZWxmLmRlbGVnYXRlKCdtdXRhdGlvbicsICdjcmVhdGVQb3N0JywgYXJncywgaW5mbylcbiAgICAgIH0sXG4gICAgICB1cGRhdGVQb3N0KGFyZ3MsIGluZm8pIHsgXG4gICAgICAgIHJldHVybiBzZWxmLmRlbGVnYXRlKCdtdXRhdGlvbicsICd1cGRhdGVQb3N0JywgYXJncywgaW5mbylcbiAgICAgIH0sXG4gICAgICBkZWxldGVQb3N0KGFyZ3MsIGluZm8pIHsgXG4gICAgICAgIHJldHVybiBzZWxmLmRlbGVnYXRlKCdtdXRhdGlvbicsICdkZWxldGVQb3N0JywgYXJncywgaW5mbylcbiAgICAgIH0sXG4gICAgICB1cHNlcnRQb3N0KGFyZ3MsIGluZm8pIHsgXG4gICAgICAgIHJldHVybiBzZWxmLmRlbGVnYXRlKCdtdXRhdGlvbicsICd1cHNlcnRQb3N0JywgYXJncywgaW5mbylcbiAgICAgIH0sXG4gICAgICByZXNldERhdGEoYXJncywgaW5mbykgeyBcbiAgICAgICAgcmV0dXJuIHNlbGYuZGVsZWdhdGUoJ211dGF0aW9uJywgJ3Jlc2V0RGF0YScsIGFyZ3MsIGluZm8pXG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICBkZWxlZ2F0ZShvcGVyYXRpb24sIGZpZWxkLCBhcmdzLCBpbmZvKSB7XG4gICAgcmV0dXJuIHN1cGVyLmRlbGVnYXRlKG9wZXJhdGlvbiwgZmllbGQsIGFyZ3MsIGluZm8pXG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL2xvYWRlcnMvYmluZGluZy5qcyEuL2xvYWRlcnMvYnVuZGxlLmpzIS4vZGF0YWJhc2Uvc2NoZW1hLmdlbmVyYXRlZC5ncmFwaHFsXG4vLyBtb2R1bGUgaWQgPSAzXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImdyYXBoY29vbC1iaW5kaW5nL2Rpc3Qvc3JjL2V4dHJhY3RGcmFnbWVudFJlcGxhY2VtZW50c1wiKTtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyBleHRlcm5hbCBcImdyYXBoY29vbC1iaW5kaW5nL2Rpc3Qvc3JjL2V4dHJhY3RGcmFnbWVudFJlcGxhY2VtZW50c1wiXG4vLyBtb2R1bGUgaWQgPSA0XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImdyYXBoY29vbC1iaW5kaW5nL2Rpc3Qvc3JjL0dyYXBoY29vbExpbmtcIik7XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gZXh0ZXJuYWwgXCJncmFwaGNvb2wtYmluZGluZy9kaXN0L3NyYy9HcmFwaGNvb2xMaW5rXCJcbi8vIG1vZHVsZSBpZCA9IDVcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiZ3JhcGhjb29sLWJpbmRpbmcvZGlzdC9zcmMvcHJlcGFyZUluZm9cIik7XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gZXh0ZXJuYWwgXCJncmFwaGNvb2wtYmluZGluZy9kaXN0L3NyYy9wcmVwYXJlSW5mb1wiXG4vLyBtb2R1bGUgaWQgPSA2XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImdyYXBocWxcIik7XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gZXh0ZXJuYWwgXCJncmFwaHFsXCJcbi8vIG1vZHVsZSBpZCA9IDdcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiZ3JhcGhxbC1yZXF1ZXN0XCIpO1xuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIGV4dGVybmFsIFwiZ3JhcGhxbC1yZXF1ZXN0XCJcbi8vIG1vZHVsZSBpZCA9IDhcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiZ3JhcGhxbC1zY2hlbWEtY2FjaGVcIik7XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gZXh0ZXJuYWwgXCJncmFwaHFsLXNjaGVtYS1jYWNoZVwiXG4vLyBtb2R1bGUgaWQgPSA5XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImdyYXBocWwtdG9vbHNcIik7XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gZXh0ZXJuYWwgXCJncmFwaHFsLXRvb2xzXCJcbi8vIG1vZHVsZSBpZCA9IDEwXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImpzb253ZWJ0b2tlblwiKTtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyBleHRlcm5hbCBcImpzb253ZWJ0b2tlblwiXG4vLyBtb2R1bGUgaWQgPSAxMVxuLy8gbW9kdWxlIGNodW5rcyA9IDAiXSwic291cmNlUm9vdCI6IiJ9