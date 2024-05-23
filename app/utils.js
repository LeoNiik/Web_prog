function extractTime(dateString) {
    // Parse the date string into a Date object
    const date = new Date(dateString);

    // Extract hours, minutes, and seconds
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    // Return the time as a string in HH:MM:SS format
    return `${hours}:${minutes}`;
}

module.exports = {extractTime};