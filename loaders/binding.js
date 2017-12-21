const { generateCode} = require('graphql-static-binding')
const { generator } = require('graphql-static-binding/dist/generators/javascript')

module.exports = function(content) {
    return generateCode(content, generator)
}