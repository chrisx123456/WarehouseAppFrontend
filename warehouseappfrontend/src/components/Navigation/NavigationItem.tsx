import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { NavigationItemData } from './NavigationData';
import { UserRole } from '../../types/User'; // Upewnij się, że masz zdefiniowany typ User
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Poprawny import
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'; // Import ikon
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
                        <span className="nav-item-label">{item.label}</span> 
                        <span className="arrow">
                            {isOpen ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />}
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
                <Link to={item.path || "#"} className="nav-link"> 
                    {item.label}
                </Link>
            )}
        </li>
    );
};

export default NavigationItem;