// utils/dateUtils.js

/**
 * Converts a Date object to a formatted string.
 * @param {Date} date - The date to format.
 * @param {string} format - The desired format (e.g., 'YYYY-MM-DD HH:mm').
 * @returns {string} The formatted date string.
 */
export const formatDate = (date, format = 'YYYY-MM-DD HH:mm') => {
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    };
    return new Date(date).toLocaleDateString(undefined, options);
};

/**
 * Checks if a date is in the past.
 * @param {Date} date - The date to check.
 * @returns {boolean} True if the date is in the past; false otherwise.
 */
export const isPastDate = (date) => {
    return date < new Date();
};

/**
 * Adds days to a given date.
 * @param {Date} date - The starting date.
 * @param {number} days - The number of days to add.
 * @returns {Date} The new date.
 */
export const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const isAfterDate = (date, comparisonDate) => {
    return new Date(date) > new Date(comparisonDate);
};