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
};