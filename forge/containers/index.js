/**
 * The connection to the container backend
 *
 * This handles creating, deleting, querying containers
 *
 * @namespace containers
 * @memberof forge
 */

/**
 * @typedef {Object} forge.containers.Project
 * @property {string} id - UUID that represents the project
 * @property {string} name - Name of the project
 * @property {number} team - ID of the owning team
 */

/**
 * @typedef {Object} forge.containers.Options
 * @property {string} domain - The root domain to expose the instance as
 */

/**
 * This needs work
 *
 * @typedef {Object} forge.containers.ProjectArguments
 *
 */

/**
 * @typedef {Object} forge.Status
 * @property {string} status
 */

const fp = require('fastify-plugin')

const wrapper = require('./wrapper.js')

const DRIVER_MODULES = {
    stub: './stub/index.js',
    localfs: '@flowfuse/driver-localfs',
    docker: '@flowforge/docker',
    kubernetes: '@flowforge/kubernetes'
}

module.exports = fp(async function (app, _opts, next) {
    const containerDialect = app.config.driver.type
    const containerModule = DRIVER_MODULES[containerDialect]
    try {
        const driver = require(containerModule)
        await wrapper.init(app, driver, {
        // await driver.init(app, {
            domain: app.config.domain || 'example.com',
            // this list needs loading from an external source
            containers: {
                basic: 'flowforge/node-red'
            }
        })
        app.decorate('containers', wrapper)
        app.log.info(`Container driver: ${containerDialect}`)
        app.addHook('onClose', async (_) => {
            app.log.info('Driver shutdown')
            await wrapper.shutdown()
        })
    } catch (err) {
        app.log.error(`Failed to load the container driver: ${containerDialect}`)
        throw err
    }

    next()
})
