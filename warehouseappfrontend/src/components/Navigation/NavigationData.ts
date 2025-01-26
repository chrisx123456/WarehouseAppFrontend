import { UserRole } from "../../types/User";

export interface NavigationItemData {
    label: string;
    path?: string; // Jeśli element jest linkiem
    children?: NavigationItemData[]; // Podmenu
    allowedRoles?: UserRole[]; // Role uprawnione do wyświetlania
}

export const navigationData: NavigationItemData[] = [
    {
        label: "Categories",
        path: "/categories",
        allowedRoles: [UserRole.User, UserRole.Manager, UserRole.Admin],
    },
    {
        label: "Manufacturers",
        path: "/manufacturers",
        allowedRoles: [UserRole.User, UserRole.Manager, UserRole.Admin],
    },
    {
        label: "Products",
        path: "/products",
        allowedRoles: [UserRole.User, UserRole.Manager, UserRole.Admin],
    },
    {
        label: "In stock",
        path: "/stock",
        allowedRoles: [UserRole.User, UserRole.Manager, UserRole.Admin],
    },
    {
        label: "Sales",
        path: "/sales",
        allowedRoles: [UserRole.User, UserRole.Manager, UserRole.Admin],
    },
    {
        label: "My Sales",
        path: "/usersale",
        allowedRoles: [UserRole.User, UserRole.Manager, UserRole.Admin],
    },
    {
        label: "Admin Panel",
        path: "/admin",
        allowedRoles: [UserRole.Admin]
    },
    {
        label: "User Panel",
        path: "/user",
        allowedRoles: [UserRole.User, UserRole.Manager, UserRole.Admin]
    }
];