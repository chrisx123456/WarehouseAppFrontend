import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { NavigationItemData } from './NavigationData';
import { UserRole } from '../../types/User'; // Upewnij się, że masz zdefiniowany typ User
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'; // Import ikon
import './Navigation.css'

interface Props {
    item: NavigationItemData,
    userRole: string
}

const NavigationItem: React.FC<Props> = ({ item, userRole }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (item.allowedRoles && !item.allowedRoles.includes(userRole as UserRole)) {
        return null;
    }

    return (
        <li>
            {item.children ? (
                <>
                    <div className="nav-item-header" onClick={() => setIsOpen(!isOpen)}>
                        <span className="nav-item-label">{item.label}</span> {/* Dodany span dla label */}
                        <span className="arrow">
                            {isOpen ? <FaChevronUp /> : <FaChevronDown />} {/* Zmiana ikon */}
                        </span>
                    </div>
                    {isOpen && (
                        <ul>
                            {item.children.map((child) => (
                                <NavigationItem item={child} userRole={userRole} key={child.label} />
                            ))}
                        </ul>
                    )}
                </>
            ) : (
                <Link to={item.path || "#"} className="nav-link"> {/* Dodana klasa dla linku */}
                    {item.label}
                </Link>
            )}
        </li>
    );
};

export default NavigationItem;