export enum UserRole {
    User = "user",
    Manager = "manager",
    Admin = "admin",
}

export interface User {
    role: UserRole;
}