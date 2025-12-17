/**
 * Request types (JSDoc reference)
 * @typedef {Object} RequestItem
 * @property {string} workshop_id
 * @property {number} position
 */

/**
 * @typedef {Object} TeacherPreference
 * @property {string} teacher_id
 * @property {string[]} workshop_ids
 */

/**
 * @typedef {Object} Request
 * @property {string} id
 * @property {string} center_id
 * @property {boolean} is_first_time
 * @property {boolean} available_for_tuesdays
 * @property {'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ALLOCATED' | 'REJECTED'} status
 * @property {RequestItem[]} items
 * @property {TeacherPreference[]} teacher_preferences
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} CreateRequestPayload
 * @property {string} center_id
 * @property {boolean} is_first_time
 * @property {boolean} available_for_tuesdays
 * @property {RequestItem[]} items
 * @property {TeacherPreference[]} teacher_preferences
 */
