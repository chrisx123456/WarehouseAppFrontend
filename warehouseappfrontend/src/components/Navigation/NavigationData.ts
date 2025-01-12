import { UserRole } from "../../types/User";

export interface NavigationItemData {
    label: string;
    path?: string; // Jeśli element jest linkiem
    children?: NavigationItemData[]; // Podmenu
    allowedRoles?: UserRole[]; // Role uprawnione do wyświetlania
}

export const navigationData: NavigationItemData[] = [
    {
        label: "Strona główna",
        path: "/",
    },
    {
        label: "Categories",
        children: [
            {
                label: "All categories",
                path: "/categories",
                allowedRoles: [UserRole.User, UserRole.Manager, UserRole.Admin],
            },
        ],

    },
    {
        label: "Manufacturers",
        path: "/manufacturers",
        allowedRoles: [UserRole.User, UserRole.Manager, UserRole.Admin],
    },

    {
        label: "Użytkownicy",
        children: [
            {
                label: "Lista użytkowników",
                path: "/users",
                allowedRoles: [UserRole.Manager, UserRole.Admin],
            },
            {
                label: "Dodaj użytkownika",
                path: "/users/add",
                allowedRoles: [UserRole.Admin],
            },
        ],
    },
    {
        label: "Produkty",
        children: [
            {
                label: "Lista produktów",
                path: "/products",
                allowedRoles: [UserRole.User, UserRole.Manager, UserRole.Admin]
            },
            {
                label: "Dodaj produkt",
                path: "/products/add",
                allowedRoles: [UserRole.Manager, UserRole.Admin]
            }
        ]
    },
    {
        label: "Panel Admina",
        path: "/admin",
        allowedRoles: [UserRole.Admin]
    }
];