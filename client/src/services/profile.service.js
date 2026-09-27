import apiClient from '../lib/apiClient';

function payload(response) {
    return response?.data ?? response;
}

export const profileService = {
    async getProfile() {
        return payload(await apiClient.get('/users/profile'));
    },
    async updateProfile(data) {
        return payload(await apiClient.patch('/users/profile', data));
    },
    async verifyCurrentPhone() {
        return payload(await apiClient.post('/users/profile/phone/verify'));
    },
    async requestEmailVerification(email) {
        return payload(await apiClient.post('/users/profile/email-verification', { email }));
    },
    async verifyEmail(email, code) {
        return payload(await apiClient.post('/users/profile/email-verification/verify', { email, code }));
    },
    async addAddress(data) {
        return payload(await apiClient.post('/users/addresses', data));
    },
    async updateAddress(id, data) {
        return payload(await apiClient.patch(`/users/addresses/${id}`, data));
    },
    async deleteAddress(id) {
        return payload(await apiClient.delete(`/users/addresses/${id}`));
    },
    async setDefaultAddress(id) {
        return payload(await apiClient.patch(`/users/addresses/${id}/default`));
    },
    async getVault() {
        return payload(await apiClient.get('/users/vault'));
    },
    async changePassword(data) {
        return payload(await apiClient.patch('/users/password', data));
    },
};

export default profileService;
