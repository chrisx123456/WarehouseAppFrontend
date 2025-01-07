import React from 'react';

interface Props {
    children: React.ReactNode;
}

const Content: React.FC<Props> = ({ children }) => (
    <div style={{ flexGrow: 1, padding: '20px' }}>{children}</div>
);

export default Content;