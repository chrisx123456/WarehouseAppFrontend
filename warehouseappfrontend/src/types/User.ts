export enum UserRole {
    User = "User",
    Manager = "Manager",
    Admin = "Admin",
}

export interface User {
    role: UserRole;
}