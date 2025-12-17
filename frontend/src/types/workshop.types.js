/**
 * Workshop types (JSDoc reference)
 * @typedef {Object} Workshop
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {'TECNOLOGIC' | 'ARTISTIC' | 'SPORTS' | 'CULTURAL'} ambit
 * @property {boolean} is_new
 * @property {'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY'} day_of_week
 * @property {string} provider
 * @property {number} available_seats
 * @property {number} total_seats
 * @property {number} [duration_hours]
 */

/**
 * @typedef {Object} WorkshopFilter
 * @property {string} [ambit]
 * @property {string} [day_of_week]
 * @property {boolean} [is_new]
 * @property {string} [search]
 */
