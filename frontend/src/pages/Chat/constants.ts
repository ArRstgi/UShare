/** Icon SVG */
export const paperclipIconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-paperclip">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
</svg>`;

/** Backend API URL */
export const API_BASE_URL = "http://localhost:3000/api";

/** File Upload Config */
export const ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

/** Initial User Data (includes availability again) */
export const initialUsersData = [
    { name: "User 1", availability: "Online" },
    { name: "User 2", availability: "Offline" },
    { name: "User 3", availability: "Busy" },
    { name: "User 4", availability: "Online" },
    { name: "User 5", availability: "Away" },
    { name: "User 6", availability: "Online" },
];
