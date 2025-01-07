import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { NavigationItemData } from './NavigationData';

interface Props {
    item: NavigationItemData,
    userRole: string
}

const NavigationItem: React.FC<Props> = ({ item, userRole }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (item.allowedRoles && !item.allowedRoles.includes(userRole as any)) {
        return null;
    }

    return (
        <li>
            {item.children ? (
                <>
                    <button onClick={() => setIsOpen(!isOpen)}>
                        {item.label}
                    </button>
                    {isOpen && (
                        <ul>
                            {item.children.map((child) => (
                                <NavigationItem item={child} userRole={userRole} key={child.label} />
                            ))}
                        </ul>
                    )}
                </>
            ) : (
                <Link to={item.path || "#"}>{item.label}</Link>
            )}
        </li>
    );
};

export default NavigationItem;