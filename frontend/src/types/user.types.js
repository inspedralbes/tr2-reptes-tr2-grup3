/**
 * User types (JSDoc reference)
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {'ADMIN' | 'CENTER' | 'TEACHER'} role
 * @property {string} [organization_id]
 */

/**
 * @typedef {Object} LoginCredentials
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} AuthResponse
 * @property {User} user
 * @property {string} token
 */
