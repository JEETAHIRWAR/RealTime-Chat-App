import { api } from "./axios";

/*
========================================
USER / PROFILE API
========================================
*/
export const userApi = {
    getProfile: () =>
        api.get("/api/users/profile")
            .then((r) => r.data),

    updateProfile: (data) =>
        api.put("/api/users/profile", data)
            .then((r) => r.data),

    changePassword: (data) =>
        api.put(
            "/api/users/change-password",
            data
        ).then((r) => r.data),

    /*
    ========================================
    PHONE VERIFICATION
    ========================================
    */
    sendPhoneVerificationOTP: (phone) =>
        api.post(
            "/api/users/send-phone-verification-otp",
            { phone }
        ).then((r) => r.data),

    verifyPhone: (phone, otp) =>
        api.post(
            "/api/users/verify-phone",
            {
                phone,
                otp
            }
        ).then((r) => r.data),
};