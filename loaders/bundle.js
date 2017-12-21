const { importSchema } = require('graphql-import')

module.exports = function(content) {
    console.log(this.resourcePath)
    const bundledSchema = importSchema(this.resourcePath);
    return bundledSchema;
}