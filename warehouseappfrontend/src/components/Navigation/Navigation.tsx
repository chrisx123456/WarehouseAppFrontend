import React from 'react';
import { navigationData } from './NavigationData';
import NavigationItem from './NavigationItem';
import { User } from '../../types/User'

interface Props {
    user: User
}

const Navigation: React.FC<Props> = ({ user }) => {

    return (
        <nav style={{ width: '200px', backgroundColor: '#f0f0f0', padding: '10px' }}>
            <ul>
                {navigationData.map((item) => (
                    <NavigationItem item={item} userRole={user.role} key={item.label} />
                ))}
            </ul>
        </nav>
    );
};

export default Navigation;