const API_BASE_URL = '/api';

const fetchData = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options,
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
    }
    return response.json();
};

export const api = {
    login: (email, password) => fetchData('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    }),
    signup: (name, email, password, role = 'PENDING') => fetchData('/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
    }),
    getUser: (id) => fetchData(`/users?id=${id}`),
    getUsers: (section = '') => fetchData(`/users${section ? `?section=${section}` : ''}`),
    createUser: (name, email, role) => fetchData('/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, role }),
    }),
    updateUser: (id, userData) => fetchData(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
    }),
    uploadAvatar: async (id, file) => {
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await fetch(`${API_BASE_URL}/users/${id}/avatar`, {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to upload avatar');
        }
        return response.json();
    },
    deleteUser: (id) => fetchData(`/users/${id}`, {
        method: 'DELETE',
    }),
    
    // Sections API
    getSections: () => fetchData('/table/sections'),
    
    // Facilities API
    getFacilities: () => fetchData('/facilities'),
    createFacility: (facilityData) => fetchData('/facilities', {
        method: 'POST',
        body: JSON.stringify(facilityData),
    }),
    updateFacility: (id, facilityData) => fetchData(`/facilities/${id}`, {
        method: 'PUT',
        body: JSON.stringify(facilityData),
    }),
    deleteFacility: (id) => fetchData(`/facilities/${id}`, {
        method: 'DELETE',
    }),

    // Announcements API
    getAnnouncements: () => fetchData('/announcements'),
    createAnnouncement: (announcementData) => fetchData('/announcements', {
        method: 'POST',
        body: JSON.stringify(announcementData),
    }),
    updateAnnouncement: (id, announcementData) => fetchData(`/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(announcementData),
    }),
    deleteAnnouncement: (id) => fetchData(`/announcements/${id}`, {
        method: 'DELETE',
    }),

    // Grades API
    getGrades: (studentId = '') => fetchData(`/grades${studentId ? `?studentId=${studentId}` : ''}`),
    createGrade: (gradeData) => fetchData('/grades', {
        method: 'POST',
        body: JSON.stringify(gradeData),
    }),
    updateGrade: (id, gradeData) => fetchData(`/grades/${id}`, {
        method: 'PUT',
        body: JSON.stringify(gradeData),
    }),
    deleteGrade: (id) => fetchData(`/grades/${id}`, {
        method: 'DELETE',
    }),

    // Modules API
    getModules: () => fetchData('/modules'),
    createModule: (moduleData) => fetchData('/modules', {
        method: 'POST',
        body: JSON.stringify(moduleData),
    }),
    updateModule: (id, moduleData) => fetchData(`/modules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(moduleData),
    }),
    deleteModule: (id) => fetchData(`/modules/${id}`, {
        method: 'DELETE',
    }),

    // Assignments API
    getAssignments: (section = '') => fetchData(`/assignments${section ? `?section=${section}` : ''}`),
    createAssignment: (assignmentData) => fetchData('/assignments', {
        method: 'POST',
        body: JSON.stringify(assignmentData),
    }),
    updateAssignment: (id, assignmentData) => fetchData(`/assignments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(assignmentData),
    }),
    deleteAssignment: (id) => fetchData(`/assignments/${id}`, {
        method: 'DELETE',
    }),

    // Submissions API
    getSubmissions: () => fetchData('/submissions'),
    submitAssignmentWork: (submissionData) => fetchData('/submissions', {
        method: 'POST',
        body: JSON.stringify(submissionData),
    }),
    gradeSubmission: (id, gradeData) => fetchData(`/submissions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(gradeData),
    }),

    // Enrollment API
    getEnrollmentApplications: () => fetchData('/enrollment'),
    submitApplication: (appData) => {
        if (appData instanceof FormData) {
            return fetch(`${API_BASE_URL}/enrollment`, {
                method: 'POST',
                body: appData,
            }).then(res => {
                if (!res.ok) return res.json().then(e => { throw new Error(e.message) });
                return res.json();
            });
        }
        return fetchData('/enrollment', {
            method: 'POST',
            body: JSON.stringify(appData),
        });
    },
    updateEnrollmentStatus: (id, status) => fetchData(`/enrollment/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    }),

    // Dropout API
    getDropoutRequests: () => fetchData('/dropouts'),
    submitDropoutRequest: (reqData) => fetchData('/dropouts', {
        method: 'POST',
        body: JSON.stringify(reqData),
    }),
    updateDropoutStatus: (id, status) => fetchData(`/dropouts/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    }),

    // Attendance API
    getAttendance: (studentId = '', date = '') => {
        const url = '/attendance?studentId=' + studentId + '&date=' + date;
        console.log('Fetching Attendance URL:', url);
        return fetchData(url);
    },
    postAttendance: (attData) => fetchData('/attendance', {
        method: 'POST',
        body: JSON.stringify(attData),
    }),
    postAttendanceBulk: (bulkData) => fetchData('/attendance/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkData),
    }),

    // Schedule API
    getSchedule: () => fetchData('/schedule'),
    postSchedule: (schData) => fetchData('/schedule', {
        method: 'POST',
        body: JSON.stringify(schData),
    }),

    // Clearance API
    getClearance: (studentId = '') => fetchData(`/clearance${studentId ? `?studentId=${studentId}` : ''}`),
    updateClearance: (id, clearanceData) => fetchData(`/clearance/${id}`, {
        method: 'PUT',
        body: JSON.stringify(clearanceData),
    }),

    // Library API
    getLibraryResources: () => fetchData('/library'),
    postLibraryResource: (libData) => fetchData('/library', {
        method: 'POST',
        body: JSON.stringify(libData),
    }),

    // Health API
    getHealthRecords: (studentId = '') => fetchData(`/health${studentId ? `?studentId=${studentId}` : ''}`),
    postHealthRecord: (healthData) => fetchData('/health', {
        method: 'POST',
        body: JSON.stringify(healthData),
    }),

    // Document Requests API
    getDocRequests: (studentId = '') => fetchData(`/doc-requests${studentId ? `?studentId=${studentId}` : ''}`),
    requestDoc: (reqData) => fetchData('/doc-requests', {
        method: 'POST',
        body: JSON.stringify(reqData),
    }),

    // Finance API
    getFinances: (studentId = '') => fetchData(`/finances${studentId ? `?studentId=${studentId}` : ''}`),
    addFeeRecord: (feeData) => fetchData('/finances', {
        method: 'POST',
        body: JSON.stringify(feeData),
    }),

    // Email Broadcast API
    getEmailLogs: () => fetchData('/email-logs'),
    getMessages: (userId) => fetchData(`/messages?userId=${userId}`),
    sendEmailBroadcast: (emailData) => fetchData('/email-broadcast', {
        method: 'POST',
        body: JSON.stringify(emailData),
    }),

    // Generic Table API (Database Forge)
    getTables: () => fetchData('/tables'),
    getTableInfo: (tableName) => fetchData(`/table/${tableName}/info`),
    getTableData: (tableName) => fetchData(`/table/${tableName}`),
    insertTableRecord: (tableName, data) => fetchData(`/table/${tableName}`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateTableRecord: (tableName, id, data) => fetchData(`/table/${tableName}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteTableRecord: (tableName, id) => fetchData(`/table/${tableName}/${id}`, {
        method: 'DELETE',
    }),
    
    // Auth Helpers
    getLockoutInfo: () => ({ attempts: 0, suspendedUntil: null }),
};